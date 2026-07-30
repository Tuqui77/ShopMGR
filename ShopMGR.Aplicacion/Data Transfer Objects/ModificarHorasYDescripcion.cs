using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo;

public class ModificarHorasYDescripcion
{
    public int Id { get; set; }
    public float Horas { get; set; }
    public string Descripcion { get; set; }
    public DateOnly Fecha { get; set; }

    //Relaciones
    public int IdTrabajo { get; set; }
}
