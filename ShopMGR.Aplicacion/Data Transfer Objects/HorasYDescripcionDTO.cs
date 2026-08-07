using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class HorasYDescripcionDTO
    {
        [Required(ErrorMessage = "La cantidad de horas es obligatoria")]
        [Range(0.25, 8)]
        public float Horas { get; set; }

        [Required(ErrorMessage = "La descripción de las horas es obligatoria")]
        [StringLength(500, ErrorMessage = "Descripcion demasiado larga")]
        public string Descripcion { get; set; } = "";

        [Required(ErrorMessage = "La fecha es obligatoria")]
        public DateOnly Fecha { get; set; }

        //Relaciones
        public int IdTrabajo { get; set; }

    }
}
