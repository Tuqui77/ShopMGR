using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Modelo
{
    public class Foto
    {
        public int Id { get; set; }
        public string RutaRelativa { get; set; }

        //Relaciones
        public int IdTrabajo { get; set; }
        public Trabajo? Trabajo { get; set; }

        private Foto() { } //constructor para EF

        public Foto(int idTrabajo, string rutaRelativa)
        {
            if (string.IsNullOrWhiteSpace(rutaRelativa))
                throw new ArgumentException("Ruta Inválida");
            if (idTrabajo <= 0)
                throw new ArgumentException("Trabajo Inválido");

            IdTrabajo = idTrabajo;
            RutaRelativa = rutaRelativa;
        }
    }
}
