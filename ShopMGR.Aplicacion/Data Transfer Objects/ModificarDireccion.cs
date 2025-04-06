namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ModificarDireccion
    {
        public int? IdCliente { get; set; }
        public string? Calle { get; set; }
        public string? Altura { get; set; }
        public string? Piso { get; set; }
        public string? Departamento { get; set; }
        public string Descripcion { get; set; }
        public string? CodigoPostal { get; set; }
    }
}
