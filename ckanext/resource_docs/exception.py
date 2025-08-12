class ResourceDocsNotFoundError(Exception):
    """Exception raised when resource documentation is not found."""

    def __init__(self, resource_id: str):
        super().__init__(f"Resource documentation for resource {resource_id} not found.")
