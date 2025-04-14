namespace ShopMGR.Dominio.Modelo
{
    public class Material
    {
        public int Id { get; set; }
        public string Descripcion { get; set; }
        public decimal Precio { get; set; }
        public double Cantidad { get; set; }

        //Relaciones
        public Presupuesto Presupuesto { get; set; }
        public int IdPresupuesto { get; set; }
    }
}
