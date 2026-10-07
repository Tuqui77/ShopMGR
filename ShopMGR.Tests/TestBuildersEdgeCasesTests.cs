using FluentAssertions;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Tests.TestBuilders;
using ShopMGR.Tests.TestBuilders.Builders;
using Xunit;

namespace ShopMGR.Tests;

public class TestBuildersEdgeCasesTests
{
    #region ClienteBuilder Edge Cases

    [Fact]
    public void ClienteBuilder_CreateWithEmptyName_DeberiaCrearClienteConNombreVacio()
    {
        // Arrange & Act
        var cliente = TestDataFactory.Cliente.CreateWithEmptyName();

        // Assert
        cliente.Should().NotBeNull();
        cliente.NombreCompleto.Should().BeEmpty();
    }

    [Fact]
    public void ClienteBuilder_CreateWithMaxLength_DeberiaCrearClienteConNombreLargo()
    {
        // Arrange & Act
        var cliente = TestDataFactory.Cliente.CreateWithMaxLength();

        // Assert
        cliente.Should().NotBeNull();
        cliente.NombreCompleto.Should().HaveLength(500);
    }

    [Fact]
    public void ClienteBuilder_CreateWithSpecialCharacters_DeberiaCrearClienteConCaracteresEspeciales()
    {
        // Arrange & Act
        var cliente = TestDataFactory.Cliente.CreateWithSpecialCharacters();

        // Assert
        cliente.Should().NotBeNull();
        cliente.NombreCompleto.Should().Contain("@#$%^&*()_+");
    }

    [Fact]
    public void ClienteBuilder_CreateWithNullCuit_DeberiaCrearClienteSinCuit()
    {
        // Arrange & Act
        var cliente = TestDataFactory.Cliente.CreateWithNullCuit();

        // Assert
        cliente.Should().NotBeNull();
        cliente.Cuit.Should().BeNull();
    }

    #endregion

    #region TrabajoBuilder Edge Cases

    [Fact]
    public void TrabajoBuilder_CreateWithEmptyTitle_DeberiaCrearTrabajoSinTitulo()
    {
        // Arrange & Act
        var trabajo = TestDataFactory.Trabajo.CreateWithEmptyTitle();

        // Assert
        trabajo.Should().NotBeNull();
        trabajo.Titulo.Should().BeEmpty();
    }

    [Fact]
    public void TrabajoBuilder_CreateWithMaxLength_DeberiaCrearTrabajoConTituloLargo()
    {
        // Arrange & Act
        var trabajo = TestDataFactory.Trabajo.CreateWithMaxLength();

        // Assert
        trabajo.Should().NotBeNull();
        trabajo.Titulo.Should().HaveLength(500);
    }

    [Fact]
    public void TrabajoBuilder_CreateWithSpecialCharacters_DeberiaCrearTrabajoConCaracteresEspeciales()
    {
        // Arrange & Act
        var trabajo = TestDataFactory.Trabajo.CreateWithSpecialCharacters();

        // Assert
        trabajo.Should().NotBeNull();
        trabajo.Titulo.Should().Contain("@#$%^&*()_+");
    }

    [Fact]
    public void TrabajoBuilder_CreateWithNegativeHours_DeberiaCrearTrabajoConHorasNegativas()
    {
        // Arrange & Act
        var trabajo = TestDataFactory.Trabajo.CreateWithNegativeHours();

        // Assert
        trabajo.Should().NotBeNull();
        trabajo.HorasEstimadas.Should().Be(-5.0);
    }

    [Fact]
    public void TrabajoBuilder_CreateWithZeroHours_DeberiaCrearTrabajoConCeroHoras()
    {
        // Arrange & Act
        var trabajo = TestDataFactory.Trabajo.CreateWithZeroHours();

        // Assert
        trabajo.Should().NotBeNull();
        trabajo.HorasEstimadas.Should().Be(0);
    }

    [Theory]
    [InlineData(EstadoTrabajo.Pendiente)]
    [InlineData(EstadoTrabajo.Iniciado)]
    [InlineData(EstadoTrabajo.Terminado)]
    public void TrabajoBuilder_ConDiferentesEstados_DeberiaCrearTrabajoConEstadoCorrecto(EstadoTrabajo estado)
    {
        // Arrange & Act
        var trabajo = TestDataFactory.Trabajo.WithEstado(estado).CreateValid();

        // Assert
        trabajo.Should().NotBeNull();
        trabajo.Estado.Should().Be(estado);
    }

    #endregion

    #region PresupuestoBuilder Edge Cases

    [Fact]
    public void PresupuestoBuilder_CreateWithEmptyTitle_DeberiaCrearPresupuestoSinTitulo()
    {
        // Arrange & Act
        var presupuesto = TestDataFactory.Presupuesto.CreateWithEmptyTitle();

        // Assert
        presupuesto.Should().NotBeNull();
        presupuesto.Titulo.Should().BeEmpty();
    }

    [Fact]
    public void PresupuestoBuilder_CreateWithMaxLength_DeberiaCrearPresupuestoConTituloLargo()
    {
        // Arrange & Act
        var presupuesto = TestDataFactory.Presupuesto.CreateWithMaxLength();

        // Assert
        presupuesto.Should().NotBeNull();
        presupuesto.Titulo.Should().HaveLength(500);
    }

    [Fact]
    public void PresupuestoBuilder_CreateWithNegativeHours_DeberiaCrearPresupuestoConHorasNegativas()
    {
        // Arrange & Act
        var presupuesto = TestDataFactory.Presupuesto.CreateWithNegativeHours();

        // Assert
        presupuesto.Should().NotBeNull();
        presupuesto.HorasEstimadas.Should().Be(-5.0);
    }

    [Fact]
    public void PresupuestoBuilder_CreateWithMaterials_DeberiaCrearPresupuestoConMateriales()
    {
        // Arrange & Act
        var presupuesto = TestDataFactory.Presupuesto.CreateWithMaterials();

        // Assert
        presupuesto.Should().NotBeNull();
        presupuesto.Materiales.Should().HaveCount(2);
    }

    [Theory]
    [InlineData(EstadoPresupuesto.Pendiente)]
    [InlineData(EstadoPresupuesto.Aceptado)]
    [InlineData(EstadoPresupuesto.Rechazado)]
    public void PresupuestoBuilder_ConDiferentesEstados_DeberiaCrearPresupuestoConEstadoCorrecto(EstadoPresupuesto estado)
    {
        // Arrange & Act
        var presupuesto = TestDataFactory.Presupuesto.WithEstado(estado).CreateValid();

        // Assert
        presupuesto.Should().NotBeNull();
        presupuesto.Estado.Should().Be(estado);
    }

    #endregion

    #region MaterialBuilder Edge Cases

    [Fact]
    public void MaterialBuilder_CreateWithEmptyDescription_DeberiaCrearMaterialSinDescripcion()
    {
        // Arrange & Act
        var material = TestDataFactory.Material.CreateWithEmptyDescription();

        // Assert
        material.Should().NotBeNull();
        material.Descripcion.Should().BeEmpty();
    }

    [Fact]
    public void MaterialBuilder_CreateWithMaxLength_DeberiaCrearMaterialConDescripcionLarga()
    {
        // Arrange & Act
        var material = TestDataFactory.Material.CreateWithMaxLength();

        // Assert
        material.Should().NotBeNull();
        material.Descripcion.Should().HaveLength(500);
    }

    [Fact]
    public void MaterialBuilder_CreateWithNegativePrice_DeberiaCrearMaterialConPrecioNegativo()
    {
        // Arrange & Act
        var material = TestDataFactory.Material.CreateWithNegativePrice();

        // Assert
        material.Should().NotBeNull();
        material.Precio.Should().Be(-100m);
    }

    [Fact]
    public void MaterialBuilder_CreateWithZeroPrice_DeberiaCrearMaterialConPrecioCero()
    {
        // Arrange & Act
        var material = TestDataFactory.Material.CreateWithZeroPrice();

        // Assert
        material.Should().NotBeNull();
        material.Precio.Should().Be(0m);
    }

    [Fact]
    public void MaterialBuilder_CreateWithNegativeQuantity_DeberiaCrearMaterialConCantidadNegativa()
    {
        // Arrange & Act
        var material = TestDataFactory.Material.CreateWithNegativeQuantity();

        // Assert
        material.Should().NotBeNull();
        material.Cantidad.Should().Be(-5.0);
    }

    #endregion

    #region MovimientoBalanceBuilder Edge Cases

    [Fact]
    public void MovimientoBuilder_CreateWithEmptyDescription_DeberiaCrearMovimientoSinDescripcion()
    {
        // Arrange & Act
        var movimiento = TestDataFactory.Movimiento.CreateWithEmptyDescription();

        // Assert
        movimiento.Should().NotBeNull();
        movimiento.Descripcion.Should().BeEmpty();
    }

    [Fact]
    public void MovimientoBuilder_CreateWithNegativeAmount_DeberiaCrearMovimientoConMontoNegativo()
    {
        // Arrange & Act
        var movimiento = TestDataFactory.Movimiento.CreateWithNegativeAmount();

        // Assert
        movimiento.Should().NotBeNull();
        movimiento.Monto.Should().Be(-500m);
    }

    [Fact]
    public void MovimientoBuilder_CreateWithZeroAmount_DeberiaCrearMovimientoConMontoCero()
    {
        // Arrange & Act
        var movimiento = TestDataFactory.Movimiento.CreateWithZeroAmount();

        // Assert
        movimiento.Should().NotBeNull();
        movimiento.Monto.Should().Be(0m);
    }

    [Theory]
    [InlineData(TipoMovimiento.Pago)]
    [InlineData(TipoMovimiento.Cargo)]
    [InlineData(TipoMovimiento.Anticipo)]
    [InlineData(TipoMovimiento.Compra)]
    [InlineData(TipoMovimiento.Ajuste)]
    public void MovimientoBuilder_ConDiferentesTipos_DeberiaCrearMovimientoConTipoCorrecto(TipoMovimiento tipo)
    {
        // Arrange & Act
        var movimiento = TestDataFactory.Movimiento.WithTipo(tipo).CreateValid();

        // Assert
        movimiento.Should().NotBeNull();
        movimiento.Tipo.Should().Be(tipo);
    }

    #endregion

    #region TelefonoClienteBuilder Edge Cases

    [Fact]
    public void TelefonoBuilder_CreateWithEmptyPhone_DeberiaCrearTelefonoVacio()
    {
        // Arrange & Act
        var telefono = TestDataFactory.Telefono.CreateWithEmptyPhone();

        // Assert
        telefono.Should().NotBeNull();
        telefono.Telefono.Should().BeEmpty();
    }

    [Fact]
    public void TelefonoBuilder_CreateWithMaxLength_DeberiaCrearTelefonoConNumeroLargo()
    {
        // Arrange & Act
        var telefono = TestDataFactory.Telefono.CreateWithMaxLength();

        // Assert
        telefono.Should().NotBeNull();
        telefono.Telefono.Should().HaveLength(50);
    }

    [Fact]
    public void TelefonoBuilder_CreateWithSpecialCharacters_DeberiaCrearTelefonoConFormatoEspecial()
    {
        // Arrange & Act
        var telefono = TestDataFactory.Telefono.CreateWithSpecialCharacters();

        // Assert
        telefono.Should().NotBeNull();
        telefono.Telefono.Should().Contain("+54-11-1234-5678");
    }

    #endregion

    #region DireccionBuilder Edge Cases

    [Fact]
    public void DireccionBuilder_CreateWithEmptyStreet_DeberiaCrearDireccionSinCalle()
    {
        // Arrange & Act
        var direccion = TestDataFactory.Direccion.CreateWithEmptyStreet();

        // Assert
        direccion.Should().NotBeNull();
        direccion.Calle.Should().BeEmpty();
    }

    [Fact]
    public void DireccionBuilder_CreateWithMaxLength_DeberiaCrearDireccionConCalleLarga()
    {
        // Arrange & Act
        var direccion = TestDataFactory.Direccion.CreateWithMaxLength();

        // Assert
        direccion.Should().NotBeNull();
        direccion.Calle.Should().HaveLength(500);
    }

    [Fact]
    public void DireccionBuilder_CreateWithMapsId_DeberiaCrearDireccionConGoogleMapsId()
    {
        // Arrange & Act
        var direccion = TestDataFactory.Direccion
            .WithMapsId("ChIJ1234567890")
            .CreateValid();

        // Assert
        direccion.Should().NotBeNull();
        direccion.MapsID.Should().Be("ChIJ1234567890");
    }

    #endregion

    #region TestDataFactory Edge Cases

    [Fact]
    public void TestDataFactory_CreateClientes_DeberiaCrearListaDeClientes()
    {
        // Arrange & Act
        var clientes = TestDataFactory.CreateClientes(5);

        // Assert
        clientes.Should().NotBeNull();
        clientes.Should().HaveCount(5);
        clientes.Should().AllSatisfy(c => c.NombreCompleto.Should().StartWith("Cliente "));
    }

    [Fact]
    public void TestDataFactory_CreateTrabajos_DeberiaCrearListaDeTrabajos()
    {
        // Arrange & Act
        var trabajos = TestDataFactory.CreateTrabajos(3);

        // Assert
        trabajos.Should().NotBeNull();
        trabajos.Should().HaveCount(3);
        trabajos.Should().AllSatisfy(t => t.Titulo.Should().StartWith("Trabajo "));
    }

    [Fact]
    public void TestDataFactory_CreateMateriales_DeberiaCrearListaDeMateriales()
    {
        // Arrange & Act
        var materiales = TestDataFactory.CreateMateriales(4);

        // Assert
        materiales.Should().NotBeNull();
        materiales.Should().HaveCount(4);
        materiales.Should().AllSatisfy(m => m.Descripcion.Should().StartWith("Material "));
    }

    #endregion
}
