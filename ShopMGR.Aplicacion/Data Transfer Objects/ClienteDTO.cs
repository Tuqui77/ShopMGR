namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ClienteDTO
    {
        public string NombreCompleto { get; set; }
        public string? Cuit { get; set; }
        public decimal? Balance { get; set; }
        public List<DireccionDTO>? Direccion { get; set; } = [];
        public List<TelefonoClienteDTO>? Telefono { get; set; } = [];
    }
}