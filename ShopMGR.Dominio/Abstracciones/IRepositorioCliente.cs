namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioCliente<Cliente> : IRepositorio<Cliente>
    {
        public Task<Cliente> ObtenerPorNombreAsync(string nombre);
        public Task<List<Cliente>> ListarTodosAsync();
    }
}
