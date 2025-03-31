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
            var telefono = await _contexto.TelefonoCliente.Where(t => t.IdCliente == idCliente).ToListAsync();

            return telefono;
        }

        public async Task<TelefonoCliente?> ObtenerPorNumeroAsync(string numero)
        {
            return await _contexto.TelefonoCliente.FirstOrDefaultAsync(x => x.Telefono == numero);
        }

        public async Task CrearTelefonoAsync(TelefonoCliente telefono)
        {
            if (!await _contexto.Clientes.AnyAsync(x => x.Id == telefono.IdCliente))
                throw new ArgumentException("No existe el cliente asociado a ese Id");
            if (await _contexto.TelefonoCliente.AnyAsync(x => x.Telefono == telefono.Telefono))
                throw new ArgumentException("Ya existe un teléfono con ese número");

            _contexto.TelefonoCliente.Add(telefono);
            await _contexto.SaveChangesAsync();
        }
    }
}
