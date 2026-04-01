class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundError(ServiceError):
    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message, 404)


class ConflictError(ServiceError):
    def __init__(self, message: str = "Resource already exists.") -> None:
        super().__init__(message, 409)


class UnauthorizedError(ServiceError):
    def __init__(self, message: str = "Unauthorized.") -> None:
        super().__init__(message, 401)


class DeliveryError(ServiceError):
    def __init__(self, message: str = "Email delivery failed.") -> None:
        super().__init__(message, 500)
