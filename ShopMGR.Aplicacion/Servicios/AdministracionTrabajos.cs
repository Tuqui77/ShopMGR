using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Aplicacion.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using AutoMapper;

namespace ShopMGR.Aplicacion.Servicios
{
    class AdministracionTrabajos(IRepositorioConEstado<Trabajo, EstadoTrabajo> repositorio, IMapper mapper) : IAdministrarTrabajos
    {
        private readonly IRepositorioConEstado<Trabajo, EstadoTrabajo> _repositorio = repositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Trabajo> CrearAsync(TrabajoDTO entidad)
        {
            var trabajo = _mapper.Map<Trabajo>(entidad);
            trabajo.Estado = EstadoTrabajo.Pendiente;

            await _repositorio.CrearAsync(trabajo);
            return trabajo;
        }

        public async Task<Trabajo> ObtenerPorIdAsync(int id)
        {
            return await _repositorio.ObtenerPorIdAsync(id);
        }

        public async Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado)
        {
            return await _repositorio.ObtenerPorEstadoAsync(estado);
        }

        public async Task<List<Trabajo>> ObtenerPorClienteAsync(int idCliente)
        {
            return await _repositorio.ObtenerPorClienteAsync(idCliente);
        }

        public async Task ActualizarAsync(int id, ModificarTrabajo entidad)
        {
            var trabajoDB = await _repositorio.ObtenerPorIdAsync(id);

            trabajoDB.IdCliente = entidad.IdCliente ?? trabajoDB.IdCliente;
            trabajoDB.Titulo = entidad.Titulo ?? trabajoDB.Titulo;
            trabajoDB.Estado = entidad.Estado ?? trabajoDB.Estado;
            trabajoDB.IdPresupuesto = entidad.IdPresupuesto ?? trabajoDB.IdPresupuesto;

            await _repositorio.ActualizarAsync(trabajoDB);
        }

        public async Task EliminarAsync(int id)
        {
            var trabajoDB = await _repositorio.ObtenerPorIdAsync(id);

            await _repositorio.EliminarAsync(trabajoDB);
        }
    }
}
