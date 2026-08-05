using ShopMGR.Dominio.Enums;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ResumenUsuarios
    {
        public int Id { get; set; }
        public string UserName { get; set;} = "";
        public RolUsuario Rol { get; set; }
    }
}
