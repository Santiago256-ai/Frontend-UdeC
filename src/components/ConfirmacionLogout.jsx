export default function ConfirmacionLogout({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        // Usamos .modal-overlay como definiste en tu CSS
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>¿Cerrar sesión?</h3>
                <p>Se cerrará tu sesión actual.</p>
                <div className="modal-actions">
                    {/* Usamos .btn-cancel y .btn-confirm para que coincidan con tu CSS */}
                    <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
                    <button className="btn-confirm" onClick={onConfirm}>Cerrar sesión</button>
                </div>
            </div>
        </div>
    );
}