namespace ShopMGR.Dominio.Modelo
{
    public class Cliente
    {

        public int Id { get; set; }
        public string NombreCompleto { get; set; }
        public string? Cuit { get; set; }
        public decimal? Balance { get; set; }

        //Relaciones
        public List<MovimientoBalance> MovimientosBalance { get; set; } = [];
        public List<Trabajo> Trabajos { get; set; } = [];
        public List<Presupuesto> Presupuestos { get; set; } = [];
        public List<TelefonoCliente> Telefono { get; set; } = [];
        public List<Direccion> Direccion { get; set; } = [];
    }
}
