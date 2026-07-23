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