using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Repositorios
{
    public class TelefonoClienteRepositorio
    {
        private readonly ShopMGRDbContexto _contexto;

        public TelefonoClienteRepositorio(ShopMGRDbContexto contexto)
        {
            _contexto = contexto;
        }

        public async Task<List<TelefonoCliente>> BuscarPorIdCliente(int idCliente)
        {
            if (_contexto.TelefonoCliente.Any(x => x.IdCliente == idCliente))
                return await _contexto.TelefonoCliente.Where(x => x.IdCliente == idCliente).ToListAsync();
            else
                throw new ArgumentException("No hay ningún teléfono asociado a ese Id");
        }

        public async Task<TelefonoCliente?> ObtenerPorNumeroAsync(string numero)
        {
            return await _contexto.TelefonoCliente.FirstOrDefaultAsync(x => x.Telefono == numero);
        }

        public async Task CrearAsync(TelefonoCliente telefono)
        {
            _contexto.TelefonoCliente.Add(telefono);
            await _contexto.SaveChangesAsync();
        }
    }
}
