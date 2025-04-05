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
    class AdministracionTrabajos(IRepositorio<Trabajo> repositorio, IMapper mapper) : IAdministrarTrabajos
    {
        private readonly IRepositorio<Trabajo> _repositorio = repositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Trabajo> CrearAsync(TrabajoDTO entidad)
        {
            var trabajo = _mapper.Map<Trabajo>(entidad);
            trabajo.estado = EstadoTrabajo.Pendiente;

            await _repositorio.CrearAsync(trabajo);
            return trabajo;
        }
        public Task<List<Trabajo>> ObtenerPorEstado(EstadoTrabajo estado)
        {
            var trabajos = _repositorio.ObtenerPorEstado(estado);

            return trabajos;
        }

        public Task<Trabajo> ObtenerPorIdAsync(int id)
        {
            var trabajo = _repositorio.ObtenerPorIdAsync(id) 
                ?? throw new KeyNotFoundException($"No se encontró el trabajo con Id {id}.");

            return trabajo;
        }

        public Task<List<Trabajo>> ObtenerPorIdCliente(int idCliente)
        {
            var trabajos = _repositorio.ObtenerPorIdCliente(idCliente) 
                ?? throw new KeyNotFoundException($"No se encontraron trabajos para el cliente con Id {idCliente}.");

            return trabajos;
        }

        public Task ActualizarAsync(int id, ModificarTrabajo entidad)
        {
            throw new NotImplementedException();
        }

        public Task EliminarAsync(int id)
        {
            throw new NotImplementedException();
        }
    }
}
