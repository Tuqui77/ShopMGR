namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarEntidades<TEntidad, TDTO, TActualizacion>
    {
        public Task<TEntidad> CrearAsync(TDTO entidad);
        public Task<TEntidad> ObtenerPorIdAsync(int id);
        public Task ActualizarAsync(int id, TActualizacion entidad);
        public Task EliminarAsync(int id);
    }
}
