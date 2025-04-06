namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConEstado<TEntidad, TEstado> : IRepositorio<TEntidad>
        where TEntidad : class
        where TEstado : Enum
    {
        public Task<List<TEntidad>> ObtenerPorEstadoAsync(TEstado estado);
        public Task<List<TEntidad>> ObtenerPorClienteAsync(int idCliente);
    }
}
