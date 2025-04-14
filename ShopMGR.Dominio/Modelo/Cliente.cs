namespace ShopMGR.Dominio.Modelo
{
    public class Cliente
    {

        public int Id { get; set; }
        public string NombreCompleto { get; set; }
        public string? Cuit { get; set; }
        public decimal? Balance { get; set; }
        public List<string> gastos = [];

        //Relaciones
        public List<Trabajo> Trabajos = [];
        public List<Presupuesto> Presupuestos = [];
        public List<TelefonoCliente> Telefono { get; set; } = [];
        public List<Direccion> Direccion { get; set; } = [];
    }
}
