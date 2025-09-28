using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionPresupuestos(
        IRepositorioConValorHora presupuestoRepositorio, 
        MapperRegistry mapper) : IAdministrarPresupuestos
    {
        private readonly IRepositorioConValorHora _presupuestoRepositorio = presupuestoRepositorio;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Presupuesto> CrearAsync(PresupuestoDTO nuevoPresupuesto)
        {
            var presupuesto = _mapper.Map<PresupuestoDTO, Presupuesto>(nuevoPresupuesto);

            presupuesto.Fecha = DateTime.Now;
            presupuesto.Estado = EstadoPresupuesto.Pendiente;
            presupuesto = await CalcularCostos(presupuesto);

            await _presupuestoRepositorio.CrearAsync(presupuesto);

            return presupuesto;
        }
        
        public async Task<Presupuesto> ObtenerPorIdAsync(int idPresupuesto)
        {
            return await _presupuestoRepositorio.ObtenerPorIdAsync(idPresupuesto);
        }

        public async Task<Presupuesto> ObtenerDetallePorIdAsync(int idPresupuesto)
        {
            return await _presupuestoRepositorio.ObtenerDetallePorIdAsync(idPresupuesto);
        }

        public async Task<List<Presupuesto>> ObtenerPorClienteAsync(int idCliente)
        {
            return await _presupuestoRepositorio.ObtenerPorClienteAsync(idCliente);
        }

        public async Task<List<Presupuesto>> ObtenerPorEstadoAsync(EstadoPresupuesto estado)
        {
            return await _presupuestoRepositorio.ObtenerPorEstadoAsync(estado);
        }

        public async Task ActualizarAsync(int idPresupuesto, ModificarPresupuesto entidad)
        {
            var presupuestoBd = await _presupuestoRepositorio.ObtenerDetallePorIdAsync(idPresupuesto);

            presupuestoBd.IdCliente = entidad.IdCliente ?? presupuestoBd.IdCliente;
            presupuestoBd.Titulo = entidad.Titulo ?? presupuestoBd.Titulo;
            presupuestoBd.Descripcion = entidad.Descripcion ?? presupuestoBd.Descripcion;
            presupuestoBd.HorasEstimadas = entidad.HorasEstimadas ?? presupuestoBd.HorasEstimadas;
            presupuestoBd.Estado = entidad.Estado ?? presupuestoBd.Estado;
            presupuestoBd = await CalcularCostos(presupuestoBd);

            await _presupuestoRepositorio.ActualizarAsync(presupuestoBd);
        }

        public async Task EliminarAsync(int idPresupuesto)
        {
            await _presupuestoRepositorio.EliminarAsync(idPresupuesto);
        }

        public async Task ActualizarCostoHoraDeTrabajo(string nuevoCosto)
        {
            await _presupuestoRepositorio.ActualizarCostoHoraDeTrabajo(nuevoCosto);
        }

        public async Task<decimal> ObtenerCostoHoraDeTrabajo()
        {
            var configuracionValorHoraDeTrabajo = await _presupuestoRepositorio.ObtenerCostoHoraDeTrabajo();

            var valorHoraDeTrabajo = decimal.Parse(configuracionValorHoraDeTrabajo.Valor);
            return valorHoraDeTrabajo;
        }

        //Método local para calcular los costos del presupuesto
        private async Task<Presupuesto> CalcularCostos(Presupuesto presupuesto)
        {
            var valorHoraDeTrabajo = await ObtenerCostoHoraDeTrabajo();
            presupuesto.CostoMateriales = presupuesto.Materiales.Count > 0 
                ? presupuesto.Materiales.Sum(m => (decimal)m.Cantidad * m.Precio) 
                : 0;
            presupuesto.CostoLabor = (decimal)presupuesto.HorasEstimadas * valorHoraDeTrabajo;
            presupuesto.CostoInsumos = presupuesto.CostoLabor * 0.1m;
            presupuesto.Total = presupuesto.CostoMateriales + presupuesto.CostoLabor + presupuesto.CostoInsumos;
            return presupuesto;
        }
    }
}
