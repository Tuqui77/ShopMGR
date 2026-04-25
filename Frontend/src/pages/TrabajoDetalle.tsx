import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx'; 
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Camera, 
  Clock, 
  User,
  CheckCircle,
  Play,
  DollarSign,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTrabajoDetalle, useTerminarTrabajo, useEliminarTrabajo, useSubirFotos, useEliminarFoto } from '../hooks/useTrabajos';
import { useClienteDetalle } from '../hooks/useClientes';
import { useStore } from '../store';
import { useState, useEffect, useCallback } from 'react';
import { formatDate, formatCurrency } from '../utils/dateFormat';
import { TrabajoForm } from '../components/TrabajoForm';
import { ImageUpload } from '../components/ImageUpload';

export function TrabajoDetalle() {
  const { id } = useParams<{ id: string }>();
  const trabajoId = id ? parseInt(id, 10) : undefined;
  
  const { data: trabajo, isLoading, error } = useTrabajoDetalle(trabajoId);
  const { data: clienteCompleto } = useClienteDetalle(trabajo?.clienteId);
  const terminarTrabajo = useTerminarTrabajo();
  const eliminarTrabajo = useEliminarTrabajo();
  const subirFotos = useSubirFotos();
  const eliminarFoto = useEliminarFoto();
  const { setShowHoursModal, setSelectedTrabajo, editingTrabajoId, setEditingTrabajoId, setImageFullscreenOpen } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  // Handle close image modal
  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageId(null);
    setIsZoomed(false);
    setImageFullscreenOpen(false);
    setShowGallery(false);
  }, [setImageFullscreenOpen]);

  // Navigate photos in gallery
  const navigateImage = useCallback((direction: number) => {
    if (!trabajo?.fotos || trabajo.fotos.length === 0) return;
    const currentIndex = trabajo.fotos.findIndex(f => f.enlace === selectedImage);
    const nextIndex = (currentIndex + direction + trabajo.fotos.length) % trabajo.fotos.length;
    setSelectedImage(trabajo.fotos[nextIndex].enlace);
    setSelectedImageId(trabajo.fotos[nextIndex].id);
  }, [trabajo?.fotos, selectedImage]);

  // Navigate to specific image by index
  const navigateToImage = useCallback((index: number) => {
    if (!trabajo?.fotos || index < 0 || index >= trabajo.fotos.length) return;
    setSelectedImage(trabajo.fotos[index].enlace);
    setSelectedImageId(trabajo.fotos[index].id);
    setIsZoomed(false);
  }, [trabajo?.fotos]);

  // Open gallery and set first image
  const openGallery = useCallback(() => {
    if (!trabajo?.fotos || trabajo.fotos.length === 0) return;
    setShowGallery(true);
    setSelectedImage(trabajo.fotos[0].enlace);
    setSelectedImageId(trabajo.fotos[0].id);
    setIsZoomed(false);
  }, [trabajo?.fotos]);

  // Handle ESC to close image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        handleCloseImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, handleCloseImage]);
  
  // Handler for uploading photos
  const handleUploadPhotos = async (files: File[]) => {
    if (!trabajoId) return;
    await subirFotos.mutateAsync({ idTrabajo: trabajoId, fotos: files });
  };
  
  const handleRegisterHours = () => {
    if (trabajo) {
      setSelectedTrabajo(trabajo);
      setShowHoursModal(true);
    }
  };
  
  const handleTerminar = async () => {
    if (trabajo && confirm('¿Terminar este trabajo? Se generará un cargo en el balance del cliente.')) {
      try {
        await terminarTrabajo.mutateAsync(trabajo.id);
      } catch (err) {
        console.error('Error al terminar trabajo:', err);
      }
    }
  };
  
  const handleEliminar = async () => {
    if (trabajo) {
      try {
        await eliminarTrabajo.mutateAsync(trabajo.id);
        window.location.href = '/trabajos';
      } catch (err) {
        console.error('Error al eliminar trabajo:', err);
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleEdit = () => {
    if (trabajo) {
      setEditingTrabajoId(trabajo.id);
    }
  };

  const handleEditSuccess = () => {
    setEditingTrabajoId(null);
  };

  

  const handleDeletePhoto = async () => {
    if (!trabajoId || selectedImageId === null) return;
    try {
      await eliminarFoto.mutateAsync({ idTrabajo: trabajoId, idImagen: selectedImageId });
      setShowDeletePhotoConfirm(false);
      setSelectedImage(null);
      setImageFullscreenOpen(false);
    } catch (err) {
      console.error('Error al eliminar foto:', err);
      setShowDeletePhotoConfirm(false);
    }
  };
  
  const getStatusBadge = () => {
    if (!trabajo) return null;
    
    const statusConfig = {
      'Pendiente': { class: 'badge-warning', label: 'Pendiente' },
      'Iniciado': { class: 'badge-active', label: 'En curso' },
      'Terminado': { class: 'badge-success', label: 'Terminado' },
    };
    
    const config = statusConfig[trabajo.estado] || statusConfig['Pendiente'];
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error || !trabajo) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--color-danger)' }}>Error al cargar trabajo</p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>¿El backend está corriendo?</p>
          <Link to="/trabajos" className="btn-secondary mt-4 inline-block">
            Volver a trabajos
          </Link>
        </div>
      </div>
    );
  }

  const progress = trabajo.horasEstimadas 
    ? Math.round((trabajo.horasRegistradas / trabajo.horasEstimadas) * 100)
    : 0;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Link to="/trabajos" className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display">Detalle del Trabajo</h1>
          </div>
          {getStatusBadge()}
        </div>
      </header>

      <section className="px-4 space-y-4">
        {/* Card principal */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</h2>
          
          {trabajo.descripcion && (
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              {trabajo.descripcion}
            </p>
          )}
          
          {trabajo.cliente && (
            <Link 
              to={`/clientes/${trabajo.cliente.id}`}
              className="flex items-center gap-3 mb-4 p-3 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-elevated)' }}>
                <User className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{trabajo.cliente.nombreCompleto}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {clienteCompleto?.telefono?.[0] || 'Sin teléfono'}
                </p>
              </div>
            </Link>
          )}
          
          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {trabajo.fechaInicio && (
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                <p style={{ color: 'var(--color-text)' }}>{formatDate(trabajo.fechaInicio)}</p>
              </div>
            )}
            {trabajo.fechaFin && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                <p style={{ color: 'var(--color-text)' }}>{formatDate(trabajo.fechaFin)}</p>
              </div>
            )}
            {trabajo.fechaFin && (
              <div>
                <p style={{ color: 'var(--color-muted)' }}>Fecha fin</p>
                <p style={{ color: 'var(--color-text)' }}>{formatDate(trabajo.fechaFin)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Progreso */}
        {trabajo.estado !== 'Pendiente' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>PROGRESO</span>
            </div>
            
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: 'var(--color-text)' }}>
                {trabajo.horasRegistradas}h registradas
              </span>
              {trabajo.horasEstimadas && (
                <span style={{ color: 'var(--color-muted)' }}>
                  / {trabajo.horasEstimadas}h estimadas
                </span>
              )}
            </div>
            
            <div className="progress-bar">
              <div 
                className={clsx('progress-fill', trabajo.estado === 'Terminado')}
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: trabajo.estado === 'Terminado' ? 'var(--color-success)' : undefined
                }}
              />
            </div>
            
            <p className="text-center text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
              {progress}% completado
            </p>
          </div>
        )}

{/* Fotos - con miniaturas */}
        {trabajo.fotosCount > 0 ? (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                  {trabajo.fotosCount} fotos
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); }}
                className="cursor-pointer"
              >
                <ImageUpload onUpload={handleUploadPhotos} />
              </button>
            </div>
            
            {/* Miniaturas clickeables */}
            <div 
              className="flex gap-2 cursor-pointer"
              onClick={openGallery}
            >
              {trabajo.fotos?.slice(0, 4).map((foto) => (
                <div
                  key={foto.id}
                  className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={foto.enlace}
                    alt={`Foto ${foto.id}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<Camera class="w-5 h-5" style="color: var(--color-muted); opacity: 0.5;" />';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
              Sin fotos
            </p>
            <ImageUpload onUpload={handleUploadPhotos} />
          </div>
        )}

        {/* Gallery modal - fullscreen with thumbnails + navigation */}
        {showGallery && selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
          >
            {/* Close button - top right */}
            <button
              onClick={() => {
                setShowGallery(false);
                setSelectedImage(null);
                setIsZoomed(false);
              }}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Delete button - top right, left of close */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeletePhotoConfirm(true); }}
              className="absolute top-4 right-16 z-20 p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"
              aria-label="Eliminar foto"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>

            {/* Previous button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(-1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Next button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Main image with zoom */}
            <img 
              src={selectedImage} 
              alt="Foto" 
              className={clsx(
                'object-contain transition-all duration-300 cursor-zoom-in',
                isZoomed 
                  ? 'max-w-none max-h-none w-auto h-auto scale-150 cursor-zoom-out' 
                  : 'max-h-[70vh] max-w-[90vw]'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
            />

            {/* Thumbnails strip at bottom */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 p-3 bg-black/60 rounded-xl overflow-x-auto max-w-[90vw]">
              {trabajo.fotos?.map((foto, index) => (
                <button
                  key={foto.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToImage(index);
                  }}
                  className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden cursor-pointer transition-all',
                    selectedImage === foto.enlace 
                      ? 'ring-2 ring-white opacity-100' 
                      : 'opacity-40 hover:opacity-80'
                  )}
                >
                  <img
                    src={foto.enlace}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<Camera class="w-3 h-3" style="color: white; opacity: 0.5;" />';
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
              {trabajo.fotos?.findIndex(f => f.enlace === selectedImage)! + 1} / {trabajo.fotosCount}
            </div>
          </div>
        )}

        {/* Image modal - solo cuando NO está en modo galería */}
        {selectedImage && !showGallery && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={handleCloseImage}
          >
            {/* Controls - positioned at corners */}
            {/* Delete button - top right, left of close button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeletePhotoConfirm(true); }}
              className="absolute top-4 right-16 z-10 p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"
              aria-label="Eliminar foto"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>

            {/* Close button - top right */}
            <button
              onClick={(e) => { e.stopPropagation(); handleCloseImage(); }}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Zoom toggle button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white/80 text-sm flex items-center gap-2"
            >
              <ZoomIn className="w-4 h-4" />
              {isZoomed ? 'Salir del zoom' : 'Hacer zoom'}
            </button>
            
            {/* Imagen - transitions smoothly between zoom states */}
            <img 
              src={selectedImage} 
              alt="Foto ampliada" 
              className={clsx(
                'object-contain transition-all duration-300 cursor-zoom-in',
                isZoomed 
                  ? 'max-w-none max-h-none w-auto h-auto scale-150' 
                  : 'max-h-[90vh] max-w-[90vw]'
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isZoomed) setIsZoomed(true);
              }}
              style={isZoomed ? { cursor: 'zoom-out' } : undefined}
            />
          </div>
        )}

        {/* Totales */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>TOTALES</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Total mano de obra</span>
              <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(trabajo.totalLabor || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Delete photo confirmation modal */}
        {showDeletePhotoConfirm && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowDeletePhotoConfirm(false)}
          >
            <div 
              className="modal-content max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Eliminar foto
              </h3>
              <p className="mb-6" style={{ color: 'var(--color-muted)' }}>
                ¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeletePhotoConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeletePhoto}
                  disabled={eliminarFoto.isPending}
                  className="btn-primary flex-1 !bg-red-500 hover:!bg-red-600"
                >
                  {eliminarFoto.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-3">
          {trabajo.estado === 'Iniciado' && (
            <>
              <button 
                onClick={handleRegisterHours}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Registrar Horas
              </button>
              <button 
                onClick={handleTerminar}
                disabled={terminarTrabajo.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {terminarTrabajo.isPending ? 'Terminando...' : 'Terminar Trabajo'}
              </button>
            </>
          )}
          
          {trabajo.estado === 'Pendiente' && (
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Iniciar Trabajo
            </button>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={handleEdit}
              className="btn-secondary flex items-center justify-center gap-2 max-w-[140px]"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary flex items-center justify-center gap-2 px-4"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="modal-content">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
              <h3 className="text-lg font-semibold mb-2">¿Eliminar trabajo?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleEliminar}
                  disabled={eliminarTrabajo.isPending}
                  style={{ 
                    backgroundColor: 'var(--color-danger)',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.625rem 1rem'
                  }}
                >
                  {eliminarTrabajo.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Trabajo Form for editing */}
      {editingTrabajoId && (
        <TrabajoForm 
          trabajoId={editingTrabajoId} 
          isOpen={true}
          onClose={() => setEditingTrabajoId(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
