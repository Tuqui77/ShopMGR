namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class PresupuestoDTO
    {
        public int horaDeTrabajo = 10000;
        public string Titulo { get; set; }
        public string? Descripcion { get; set; }
        public List<MaterialDTO> Materiales { get; set; }
        public double HorasEstimadas { get; set; }

        //Relaciones
        public int IdCliente { get; set; }
        public int IdTrabajo { get; set; }
    }
}
