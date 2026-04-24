using FluentAssertions;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using Xunit;

namespace ShopMGR.Tests;

public class DominioModelTests
{
    #region Usuario

    [Fact]
    public void Usuario_DeberiaPoderSetearYLeerPropiedades()
    {
        // Arrange & Act
        var usuario = new Usuario
        {
            Id = 1,
            UserName = "admin",
            PasswordHash = "hash123",
        };

        // Assert
        usuario.Id.Should().Be(1);
        usuario.UserName.Should().Be("admin");
        usuario.PasswordHash.Should().Be("hash123");
    }

    [Fact]
    public void Usuario_DeberiaTenerValoresPorDefecto()
    {
        // Arrange & Act
        var usuario = new Usuario();

        // Assert
        usuario.Id.Should().Be(0);
        usuario.UserName.Should().Be(string.Empty);
        usuario.PasswordHash.Should().Be(string.Empty);
    }

    #endregion

    #region ConfiguracionGlobal

    [Fact]
    public void ConfiguracionGlobal_DeberiaPoderSetearYLeerPropiedades()
    {
        // Arrange & Act
        var config = new ConfiguracionGlobal
        {
            Id = 5,
            Clave = "ValorHoraDeTrabajo",
            Valor = 250m,
        };

        // Assert
        config.Id.Should().Be(5);
        config.Clave.Should().Be("ValorHoraDeTrabajo");
        config.Valor.Should().Be(250m);
    }

    [Fact]
    public void ConfiguracionGlobal_DeberiaTenerValoresNullPorDefecto()
    {
        // Arrange & Act
        var config = new ConfiguracionGlobal();

        // Assert
        config.Id.Should().Be(0);
        config.Clave.Should().BeNull();
        config.Valor.Should().Be(0); // decimal defaults to 0, not null
    }

    #endregion

    #region Foto

    [Fact]
    public void Foto_DeberiaPoderSetearYLeerPropiedades()
    {
        // Arrange & Act
        var foto = new Foto(10, "/fotos/trabajo1/foto1.jpg")
        {
            Id = 1,
        };

        // Assert
        foto.Id.Should().Be(1);
        foto.RutaRelativa.Should().Be("/fotos/trabajo1/foto1.jpg");
        foto.IdTrabajo.Should().Be(10);
    }

    [Fact]
    public void Foto_DeberiaTenerNavigacionATrabajo()
    {
        // Arrange
        var trabajo = new Trabajo { Id = 1, Titulo = "Reparación" };

        // Act
        var foto = new Foto(trabajo.Id, "/fotos/trabajo1/foto1.jpg")
        {
            Id = 1,
            Trabajo = trabajo,
        };

        // Assert
        foto.Trabajo.Should().NotBeNull();
        foto.Trabajo.Titulo.Should().Be("Reparación");
    }

    #endregion

    #region HorasYDescripcion

    [Fact]
    public void HorasYDescripcion_DeberiaPoderSetearYLeerPropiedades()
    {
        // Arrange & Act
        var horasDesc = new HorasYDescripcion
        {
            Id = 1,
            Horas = 5.5f,
            Descripcion = "Cambio de aceite",
            Fecha = new DateOnly(2024, 1, 15),
            IdTrabajo = 10,
        };

        // Assert
        horasDesc.Id.Should().Be(1);
        horasDesc.Horas.Should().Be(5.5f);
        horasDesc.Descripcion.Should().Be("Cambio de aceite");
        horasDesc.Fecha.Should().Be(new DateOnly(2024, 1, 15));
        horasDesc.IdTrabajo.Should().Be(10);
    }

    [Fact]
    public void HorasYDescripcion_DeberiaTenerNavigacionATrabajo()
    {
        // Arrange
        var trabajo = new Trabajo { Id = 1, Titulo = "Reparación" };

        // Act
        var horasDesc = new HorasYDescripcion
        {
            Id = 1,
            Horas = 2.5f,
            Descripcion = "Diagnóstico",
            Fecha = new DateOnly(2024, 1, 15),
            IdTrabajo = trabajo.Id,
            Trabajo = trabajo,
        };

        // Assert
        horasDesc.Trabajo.Should().NotBeNull();
        horasDesc.Trabajo.Titulo.Should().Be("Reparación");
    }

    #endregion

    #region Material

    [Fact]
    public void Material_DeberiaPoderSetearYLeerPropiedades()
    {
        // Arrange & Act
        var material = new Material
        {
            Id = 1,
            Descripcion = "Tornillos",
            Precio = 100.50m,
            Cantidad = 5.0,
            IdPresupuesto = 10,
        };

        // Assert
        material.Id.Should().Be(1);
        material.Descripcion.Should().Be("Tornillos");
        material.Precio.Should().Be(100.50m);
        material.Cantidad.Should().Be(5.0);
        material.IdPresupuesto.Should().Be(10);
    }

    [Fact]
    public void Material_DeberiaTenerNavigacionAPresupuesto()
    {
        // Arrange
        var presupuesto = new Presupuesto { Id = 1, Titulo = "Presupuesto 1" };

        // Act
        var material = new Material
        {
            Id = 1,
            Descripcion = "Tornillos",
            Precio = 50m,
            Cantidad = 3.0,
            IdPresupuesto = presupuesto.Id,
            Presupuesto = presupuesto,
        };

        // Assert
        material.Presupuesto.Should().NotBeNull();
        material.Presupuesto.Titulo.Should().Be("Presupuesto 1");
    }

    #endregion
}
