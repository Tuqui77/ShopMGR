namespace ShopMGR.Dominio.Modelo
{
    public class HorasYDescripcion
    {
        public int Id { get; set; }
        public float Horas { get; set; }
        public string Descripcion { get; set; }
        public DateTime Fecha { get; set; }

        //relaciones
        public Trabajo Trabajo { get; set; }
        public int IdTrabajo { get; set; }
    }
}
