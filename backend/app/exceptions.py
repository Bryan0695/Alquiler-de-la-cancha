class ValidacionException(Exception):
    """
    ValidacionException - paso 18 del diagrama.
    Los datos no cumplen las reglas de negocio.
    """
    pass


class IntegridadException(Exception):
    """
    IntegridadException - se usara en eliminar cancha.
    La operacion viola una regla de integridad.
    """
    pass


class RecursoNoEncontradoException(Exception):
    """
    El recurso solicitado no existe.
    Se traduce a HTTP 404.
    """
    pass


class AccesoDenegadoException(Exception):
    """
    El recurso existe, pero el usuario no tiene permiso sobre el.
    Se traduce a HTTP 403.
    """
    pass