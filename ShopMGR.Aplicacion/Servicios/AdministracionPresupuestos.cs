using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionPresupuestos(PresupuestoRepositorio presupuestoRepositorio, IMapper mapper) : IAdministrarPresupuestos
    {
        private readonly PresupuestoRepositorio _presupuestoRepositorio = presupuestoRepositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Presupuesto> CrearAsync(PresupuestoDTO nuevoPresupuesto)
        {
            var presupuesto = _mapper.Map<Presupuesto>(nuevoPresupuesto);

            presupuesto.Fecha = DateTime.Now;
            presupuesto.Estado = EstadoPresupuesto.Pendiente;
            presupuesto.CostoMateriales = presupuesto.Materiales.Sum(m => (decimal)m.Cantidad * m.Precio);
            presupuesto.CostoLabor = (decimal)presupuesto.HorasEstimadas * presupuesto.horaDeTrabajo;
            presupuesto.CostoInsumos = presupuesto.CostoLabor * 0.1m;
            presupuesto.Total = presupuesto.CostoMateriales + presupuesto.CostoLabor + presupuesto.CostoInsumos;

            await _presupuestoRepositorio.CrearAsync(presupuesto);

            return presupuesto;
        }

        public async Task<Presupuesto> ObtenerPorIdAsync(int idPresupuesto)
        {
            var presupuesto = await _presupuestoRepositorio.ObtenerPorIdAsync(idPresupuesto);

            return presupuesto;
        }

        //Agregar métodos para listar presupuestos por clientes o por estado.
        public async Task<List<Presupuesto>> ObtenerPorClienteAsync(int idCliente)
        {
            var presupuestos = await _presupuestoRepositorio.ObtenerPorClienteAsync(idCliente);

            return presupuestos;
        }

        public async Task<List<Presupuesto>> ObtenerPorEstadoAsync(EstadoPresupuesto estado)
        {
            var presupuestos = await _presupuestoRepositorio.ObtenerPorEstadoAsync(estado);
            return presupuestos;
        }





        //Fin Metodos nuevos
        public async Task ActualizarAsync(int idPresupuesto, ModificarPresupuesto entidad)
        {
            var presupuestoDB = await _presupuestoRepositorio.ObtenerPorIdAsync(idPresupuesto);

            presupuestoDB.IdCliente = entidad.IdCliente ?? presupuestoDB.IdCliente;
            presupuestoDB.Titulo = entidad.Titulo ?? presupuestoDB.Titulo;
            presupuestoDB.Descripcion = entidad.Descripcion ?? presupuestoDB.Descripcion;
            presupuestoDB.Materiales = entidad.Materiales ?? presupuestoDB.Materiales;
            presupuestoDB.horaDeTrabajo = entidad.horaDeTrabajo ?? presupuestoDB.horaDeTrabajo;
            presupuestoDB.HorasEstimadas = entidad.HorasEstimadas ?? presupuestoDB.HorasEstimadas;
            presupuestoDB.Estado = entidad.Estado ?? presupuestoDB.Estado;

            await _presupuestoRepositorio.ActualizarAsync(presupuestoDB);
        }

        public async Task EliminarAsync(int idPresupuesto)
        {
            var presupuestoDB = await _presupuestoRepositorio.ObtenerPorIdAsync(idPresupuesto);

            await _presupuestoRepositorio.EliminarAsync(presupuestoDB);
        }

    }
}
