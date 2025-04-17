using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionPresupuestos(IRepositorioConValorHora presupuestoRepositorio, IMapper mapper) : IAdministrarPresupuestos
    {
        private readonly IRepositorioConValorHora _presupuestoRepositorio = presupuestoRepositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Presupuesto> CrearAsync(PresupuestoDTO nuevoPresupuesto)
        {
            var presupuesto = _mapper.Map<Presupuesto>(nuevoPresupuesto);

            presupuesto.Fecha = DateTime.Now;
            presupuesto.Estado = EstadoPresupuesto.Pendiente;
            presupuesto = CalcularCostos(presupuesto);

            await _presupuestoRepositorio.CrearAsync(presupuesto);

            return presupuesto;
        }
        
        public async Task<Presupuesto> ObtenerPorIdAsync(int idPresupuesto)
        {
            var presupuesto = await _presupuestoRepositorio.ObtenerPorIdAsync(idPresupuesto);

            return presupuesto;
        }

        public async Task<Presupuesto> ObtenerDetallePorIdAsync(int idPresupuesto)
        {
            return await _presupuestoRepositorio.ObtenerDetallePorIdAsync(idPresupuesto);
        }

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

        public async Task ActualizarAsync(int idPresupuesto, ModificarPresupuesto entidad)
        {
            var presupuestoDB = await _presupuestoRepositorio.ObtenerDetallePorIdAsync(idPresupuesto);

            presupuestoDB.IdCliente = entidad.IdCliente ?? presupuestoDB.IdCliente;
            presupuestoDB.Titulo = entidad.Titulo ?? presupuestoDB.Titulo;
            presupuestoDB.Descripcion = entidad.Descripcion ?? presupuestoDB.Descripcion;
            presupuestoDB.HorasEstimadas = entidad.HorasEstimadas ?? presupuestoDB.HorasEstimadas;
            presupuestoDB.Estado = entidad.Estado ?? presupuestoDB.Estado;
            presupuestoDB = CalcularCostos(presupuestoDB);

            await _presupuestoRepositorio.ActualizarAsync(presupuestoDB);
        }

        public async Task EliminarAsync(int idPresupuesto)
        {
            await _presupuestoRepositorio.EliminarAsync(idPresupuesto);
        }

        //Método local para calcular los costos del presupuesto
        private static Presupuesto CalcularCostos(Presupuesto presupuesto)
        {
            presupuesto.CostoMateriales = presupuesto.Materiales.Count > 0 
                ? presupuesto.Materiales.Sum(m => (decimal)m.Cantidad * m.Precio) 
                : 0;
            //presupuesto.CostoLabor = (decimal)presupuesto.HorasEstimadas * presupuesto.ValorHoraDeTrabajo; //Cambio por la lectura de la base de datos.
            presupuesto.CostoInsumos = presupuesto.CostoLabor * 0.1m;
            presupuesto.Total = presupuesto.CostoMateriales + presupuesto.CostoLabor + presupuesto.CostoInsumos;
            return presupuesto;
        }

        public async Task ActualizarCostoHoraDeTrabajo(string nuevoCosto)
        {
            await _presupuestoRepositorio.ActualizarCostoHoraDeTrabajo(nuevoCosto);
        }
    }
}
