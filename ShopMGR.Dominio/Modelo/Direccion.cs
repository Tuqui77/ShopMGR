using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Modelo
{
    public class Direccion
    {
        public int Id { get; set; }
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; }
        public string Calle { get; set; }
        public string Altura { get; set; }
        public string? Piso { get; set; }
        public string? Departamento { get; set; }
        public string? Descripcion { get; set; }
        public string? CodigoPostal { get; set; }
        public string? MapsID { get; set; }
    }
}
