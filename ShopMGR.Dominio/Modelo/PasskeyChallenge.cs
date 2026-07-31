namespace ShopMGR.Dominio.Modelo
{
    public class PasskeyChallenge
    {
        public int Id { get; private set; }
        public string Tipo { get; private set; } = null!;
        public string ChallengeBase64 { get; private set; } = null!;
        public string OpcionesJson { get; private set; } = null!;
        public int? IdUsuario { get; private set; }
        public DateTime FechaExpiracion { get; private set; }
        public bool EstaExpirado => DateTime.Now > FechaExpiracion;

        public Usuario? Usuario { get; private set; }

        private PasskeyChallenge() { } //Constructor para EF

        public PasskeyChallenge(
                string tipo,
                byte[] challenge,
                string opcionesJson,
                int? idUsuario = null)
        {
            Tipo = tipo;
            ChallengeBase64 = Convert.ToBase64String(challenge);
            OpcionesJson = opcionesJson;
            IdUsuario = idUsuario;
            FechaExpiracion = DateTime.Now.AddMinutes(5);
        }
    }
}
