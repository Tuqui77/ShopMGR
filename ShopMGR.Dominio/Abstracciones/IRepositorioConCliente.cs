namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConCliente<TEntity> : IRepositorio<TEntity>
        where TEntity : class
    {
        public Task<List<TEntity>> ObtenerPorIdCliente(int idCliente);
        public Task Validar(TEntity entidad);
    }
}
