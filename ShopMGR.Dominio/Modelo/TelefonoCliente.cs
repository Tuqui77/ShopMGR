namespace ShopMGR.Dominio.Modelo
{
    public class TelefonoCliente
    {
        public int Id { get; set; }
        public string Telefono { get; set; }
        public string Descripcion { get; set; }

        //Relaciones
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; }
    }
}
