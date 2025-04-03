using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Servicios
{
    class AdministracionTrabajos
    {
        public Trabajo AgregarTrabajo(Cliente? cliente = null, Presupuesto? presupuesto = null)
        {
            if (cliente == null && presupuesto == null) throw new ArgumentException("Debe proporcionar al menos un parametro");

            Trabajo trabajo = new();
            trabajo.fechaInicio = DateTime.Now;
            trabajo.estado = EstadoTrabajo.Pendiente;
            if (presupuesto != null)
            {
                trabajo.Presupuesto = presupuesto;
                trabajo.Cliente = presupuesto.Cliente;
            }
            else trabajo.Cliente = cliente!;
            return trabajo;
        }

        public float AgregarHoras(float cantidad, string descripcion)
        {
            if (cantidad <= 0) throw new ArgumentException("La cantidad de horas tiene que ser mayor a 0");

            Trabajo trabajo = new();
            trabajo.HorasYDescripcion.Add(cantidad, descripcion);
            return trabajo.HorasYDescripcion.Sum(d => d.Key);
        }

        public void AgregarFotos(byte[] foto)
        {
            Trabajo trabajo = new();
            if (foto! != null && foto.Length > 0)
            {
                trabajo.Fotos.Add(foto);
            }
        }
    }
}
