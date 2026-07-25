# DevOps Analysis Report — 23/07/2026 (Corregido)

## Resumen Ejecutivo

- **Total de hallazgos**: 20
- **Críticos**: 2 | **Mayores**: 8 | **Menores**: 6 | **Info**: 4
- **Scope analizado**: DevOps (Docker, CI/CD, GitHub Actions)
- **Nota**: Este reporte fue corregido tras verificación manual. Se eliminó 1 falso positivo.

---

## CRÍTICOS

### [CRÍTICO] Dockerfile hardcoded ASPNETCORE_ENVIRONMENT=Development
- **Archivo**: `Dockerfile:30`
- **Código**: `ENV ASPNETCORE_ENVIRONMENT=Development`
- **Problema**: La imagen Docker siempre se ejecuta en modo Development. Esto:
  - Expone stack traces detallados en errores
  - Habilita Swagger UI/Scalar en producción
  - Deshabilita HTTPS y HSTS
  - Muestra información sensible en respuestas de error
- **Recomendación**: Eliminar esta línea del Dockerfile. Configurar `ASPNETCORE_ENVIRONMENT` como variable de entorno en `docker-compose.yaml`:
  ```yaml
  environment:
    - ASPNETCORE_ENVIRONMENT=Production
  ```
- **Referencia**: OWASP - Security Misconfiguration (A05:2021)
- **Severidad real**: ⚠️ Depende del contexto. Si solo se usa en desarrollo local, el impacto es bajo. Si se va a producción, es crítico.

### [CRÍTICO] Puerto de SQL Server expuesto al host
- **Archivo**: `docker-compose.yaml:9`
- **Código**: `ports: - "1433:1433"`
- **Problema**: El puerto de SQL Server está mapeado al host, permitiendo conexiones directas desde fuera de Docker. Combinado con credenciales en `environment.env`, esto es un vector de ataque si la máquina está expuesta a red.
- **Recomendación**: Eliminar el mapeo de puerto `1433:1433` para producción. Los contenedores se comunican entre sí a través de la red de Docker. Si se necesita acceso desde el host para debugging, usar un profile separado.
- **Referencia**: Docker Security Best Practices
- **Severidad real**: 🟠 Común en desarrollo local, pero riesgoso en producción o si la máquina está en red compartida.

---

## ~~CRÍTICOS ELIMINADOS (Falsos Positivos)~~

### ~~[CRÍTICO] Secrets hardcodeados en environment.env versionado~~ ❌ FALSO POSITIVO
- **Razón de eliminación**: `environment.env` está en `.gitignore` (línea 383) y NO está versionado en el repositorio. `git ls-files environment.env` no devuelve resultados. El archivo existe localmente pero está correctamente ignorado.

---

## MAYORES

### [MAYOR] Dockerfile multi-stage sin optimización de capas
- **Archivo**: `Dockerfile`
- **Problema**: El Dockerfile tiene multi-stage builds pero:
  - El stage `build-env` (línea 2) se declara pero no se usa
  - Las capas de `COPY . ./` copian todo el código fuente, incluyendo archivos innecesarios
  - No hay `.dockerignore` para excluir archivos del contexto
- **Recomendación**:
  1. Eliminar el stage `build-env` no utilizado
  2. Crear `.dockerignore` excluyendo `node_modules`, `bin`, `obj`, `.git`, etc.
  3. Copiar solo archivos necesarios en cada stage
- **Referencia**: Docker Best Practices - Multi-stage Builds

### [MAYOR] Sin health checks en docker-compose
- **Archivo**: `docker-compose.yaml`
- **Problema**: Ni el servicio `app` ni `db` tienen health checks configurados. Docker no puede determinar si los servicios están realmente listos para recibir tráfico.
- **Recomendación**:
  ```yaml
  services:
    app:
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:80/health"]
        interval: 30s
        timeout: 10s
        retries: 3
    db:
      healthcheck:
        test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -Q "SELECT 1"
        interval: 10s
        timeout: 5s
        retries: 5
  ```
- **Referencia**: Docker Compose Healthcheck

### [MAYOR] Sin configuración de recursos en contenedores
- **Archivo**: `docker-compose.yaml`
- **Problema**: Los contenedores no tienen límites de recursos configurados (CPU, memoria). En un servidor compartido, un contenedor puede consumir todos los recursos.
- **Recomendación**: Agregar límites de recursos:
  ```yaml
  services:
    app:
      deploy:
        resources:
          limits:
            cpus: '1.0'
            memory: 512M
  ```
- **Referencia**: Docker Resource Limits

### [MAYOR] GitHub Actions sin cache de NuGet
- **Archivo**: `.github/workflows/tests.yml:19-23`
- **Problema**: El pipeline de tests ejecuta `dotnet restore` sin cache de paquetes NuGet. Cada ejecución descarga todas las dependencias.
- **Recomendación**: Agregar cache de NuGet:
  ```yaml
  - uses: actions/cache@v4
    with:
      path: ~/.nuget/packages
      key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}
  ```
- **Referencia**: GitHub Actions Caching

### [MAYOR] GitHub Actions sin cache de npm (en tests)
- **Archivo**: `.github/workflows/tests.yml:33-39`
- **Problema**: El pipeline de tests de frontend ejecuta `npm install` sin cache. Cada ejecución instala todas las dependencias desde cero.
- **Recomendación**: Configurar cache de npm:
  ```yaml
  - uses: actions/cache@v4
    with:
      path: ~/.npm
      key: ${{ runner.os }}-npm-${{ hashFiles('Frontend/package-lock.json') }}
  ```
- **Referencia**: GitHub Actions Caching

### [MAYOR] sinc-dev.yml riesgo de merge conflict
- **Archivo**: `.github/workflows/sinc-dev.yml:25-30`
- **Problema**: El workflow sincroniza `main` → `development` con un merge directo. Si hay conflictos, el workflow fallará sin mecanismo de resolución.
- **Recomendación**:
  1. Agregar `continue-on-error: true` y notificación en caso de conflicto
  2. Considerar usar rebase en lugar de merge para mantener historial limpio
  3. Agregar verificación de que no hay conflictos antes del push
- **Referencia**: Git Branching Strategy

### [MAYOR] lint.yaml ejecuta en PR pero sin verificar si hay cambios
- **Archivo**: `.github/workflows/lint.yaml`
- **Problema**: El workflow de lint se ejecuta en todos los PRs a main, incluso si no hay cambios en el frontend o backend. Esto desperdicia recursos de CI.
- **Recomendación**: Agregar verificación de cambios:
  ```yaml
  - uses: dorny/paths-filter@v3
    id: changes
    with:
      filters: |
        frontend:
          - 'Frontend/**'
        backend:
          - '**/*.cs'
  ```
- **Referencia**: GitHub Actions Path Filtering

### [MAYOR] Sin variable de entorno para JWT__KEY en producción
- **Archivo**: `environment.env`
- **Problema**: El JWT key es el mismo para desarrollo y producción. No hay separación de secrets por ambiente.
- **Recomendación**: Crear `environment.production.env` con secrets específicos de producción. Nunca usar el mismo JWT key en diferentes ambientes.
- **Referencia**: Secret Management

---

## MENORES

### [MENOR] Sin Docker layer caching para frontend
- **Archivo**: `Dockerfile:7-11`
- **Problema**: El COPY de `package*.json` y `package-lock*.json` está bien, pero falta el `.dockerignore` para evitar copiar `node_modules` al contexto.
- **Recomendación**: Crear `.dockerignore` con `node_modules/`, `.git/`, `bin/`, `obj/`.
- **Referencia**: Docker Build Cache

### [MENOR] DBSeeder como servicio sin auto-cleanup
- **Archivo**: `docker-compose.yaml:25-35`
- **Problema**: El servicio `seeder` queda como contenedor detenido después de ejecutarse. No hay limpieza automática.
- **Recomendación**: Usar `docker compose run --rm seeder` para ejecutar y limpiar automáticamente, o agregar `restart: "no"` explícitamente.
- **Referencia**: Docker Compose Best Practices

### [MENOR] Sin configuración de logging en contenedores
- **Archivo**: `docker-compose.yaml`
- **Problema**: No hay configuración de driver de logging. Los logs pueden crecer indefinidamente.
- **Recomendación**: Configurar logging driver:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```
- **Referencia**: Docker Logging

### [MENOR] Puerto 3000 hardcodeado
- **Archivo**: `docker-compose.yaml:18`
- **Problema**: El puerto 3000 está hardcodeado. Si este puerto está en uso, el contenedor no iniciará.
- **Recomendación**: Usar variable de entorno o documentar que el puerto puede ser cambiado.
- **Referencia**: Docker Port Mapping

### [MENOR] Sin configuración de restart policy
- **Archivo**: `docker-compose.yaml`
- **Problema**: Los servicios no tienen `restart` policy configurada. Si el contenedor crashea, no se reiniciará automáticamente.
- **Recomendación**: Agregar `restart: unless-stopped` a los servicios principales.
- **Referencia**: Docker Restart Policy

### [MENOR] GitHub Actions sin concurrency group
- **Archivo**: `.github/workflows/*.yaml`
- **Problema**: Si se hace push a main mientras un workflow está corriendo, se ejecutarán dos workflows simultáneamente, lo que puede causar conflictos.
- **Recomendación**: Agregar concurrency group:
  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
- **Referencia**: GitHub Actions Concurrency

---

## INFO

### [INFO] Multi-stage build correctly implemented
- **Archivo**: `Dockerfile`
- **Observación**: El Dockerfile usa multi-stage builds para separar frontend y backend builds. Esto reduce el tamaño de la imagen final.
- **Recomendación**: Mantener esta práctica y optimizar cada stage.

### [INFO] GitHub Actions workflows bien estructurados
- **Archivo**: `.github/workflows/`
- **Observación**: Hay workflows separados para lint, tests, release, y sync. Buena separación de responsabilidades.
- **Recomendación**: Mantener esta estructura y agregar workflows para security scanning.

### [INFO] Semantic Release configurado
- **Archivo**: `.github/workflows/release.yaml`
- **Observación**: El uso de semantic-release para versionado automático es una buena práctica.
- **Recomendación**: Configurar branches y prerelease channels según necesidades del proyecto.

### [INFO] Docker BuildKit habilitado
- **Archivo**: `Dockerfile:1`
- **Código**: `# syntax=docker/dockerfile:1`
- **Observación**: BuildKit está habilitado, lo que permite features como caché de mounts.
- **Recomendación**: Aprovechar features de BuildKit como `--mount=type=cache` para builds más rápidos.

---

*Generated by Code Analyst v1.0 — 23/07/2026 (Corregido por verificación manual)*
