using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class MaterialDTO
    {
        [Required(ErrorMessage = "La descripción del material es obligatoria")]
        public string Descripcion { get; set; } = "";

        [Required(ErrorMessage = "El precio del material es obligatorio")]
        public decimal Precio { get; set; }

        [Required(ErrorMessage = "La cantidad del material es obligatoria")]
        public double Cantidad { get; set; }
    }
}
