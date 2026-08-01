using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    public class Passkey
    {
        public byte[] IdCredencial { get; private set; }
        public byte[] ClavePublica { get; private set; }
        public uint ContadorLogin { get; private set; }
        public string Nombre { get; private set; }
        public DateTime FechaCreacion { get; private set; }
        public DateTime? UltimoUso { get; private set; }
        public string? Attestation { get; set; }

        // Relaciones
        public Usuario Usuario { get; private set; }
        public int IdUsuario { get; private set; }

        private Passkey() { } //Constructor para EF

        public Passkey(
                byte[] idCredencial,
                byte[] clavePublica,
                string nombre,
                int idUsuario,
                string? attestation = null)
        {

            IdCredencial = idCredencial ?? throw new ArgumentNullException(nameof(idCredencial));
            ClavePublica = clavePublica ?? throw new ArgumentNullException(nameof(clavePublica));
            Nombre = nombre ?? throw new ArgumentNullException(nameof(nombre));
            IdUsuario = idUsuario;
            ContadorLogin = 0;
            FechaCreacion = DateTime.Now;
            Attestation = attestation;
        }

        public void IncrementarContador()
        {
            ContadorLogin++;
            UltimoUso = DateTime.Now;
        }

        public void ActualizarContador(uint contador)
        {
            ContadorLogin = contador;
            UltimoUso = DateTime.Now;
        }

        public void EditarNombre(string nuevoNombre)
        {
            Nombre = nuevoNombre;
        }
    }
}
