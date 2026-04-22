import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
    openapi: "3.0.3",
    info: {
        title: "Gestor Bancario API",
        version: "1.0.0",
        description: "Documentación de la API para gestión de cuentas y transacciones bancarias."
    },
    servers: [
        {
            url: "http://localhost:3000/gestionBancaria/api/v1",
            description: "Servidor local"
        },
        {
            url: "http://localhost:3001/api/v1",
            description: "AuthService local"
        }
    ],
    tags: [
        {
            name: "Authentication",
            description: "Endpoints del servicio de autenticación"
        },
        {
            name: "Profile",
            description: "Endpoints de perfil de usuario"
        }
    ],
    paths: {
        "/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Registra un nuevo usuario",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                $ref: "#/components/schemas/AuthRegisterRequest"
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Usuario registrado exitosamente"
                    },
                    "400": {
                        description: "Errores de validación"
                    },
                    "409": {
                        description: "Email ya existe"
                    }
                }
            }
        },
        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Autentica un usuario",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthLoginRequest"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Login exitoso"
                    },
                    "401": {
                        description: "Credenciales inválidas"
                    },
                    "423": {
                        description: "Cuenta bloqueada"
                    }
                }
            }
        },
        "/auth/verify-email": {
            post: {
                tags: ["Authentication"],
                summary: "Verifica el email del usuario",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthTokenRequest"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Email verificado exitosamente"
                    },
                    "400": {
                        description: "Token inválido o expirado"
                    }
                }
            }
        },
        "/auth/resend-verification": {
            post: {
                tags: ["Authentication"],
                summary: "Reenvía el email de verificación",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthEmailRequest"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Email reenviado exitosamente"
                    },
                    "404": {
                        description: "Usuario no encontrado"
                    }
                }
            }
        },
        "/auth/forgot-password": {
            post: {
                tags: ["Authentication"],
                summary: "Inicia recuperación de contraseña",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthEmailRequest"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Instrucciones enviadas al email"
                    }
                }
            }
        },
        "/auth/reset-password": {
            post: {
                tags: ["Authentication"],
                summary: "Resetea la contraseña",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthResetPasswordRequest"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Contraseña actualizada exitosamente"
                    },
                    "400": {
                        description: "Token inválido o expirado"
                    }
                }
            }
        },
        "/auth/profile": {
            get: {
                tags: ["Profile"],
                summary: "Obtiene el perfil del usuario autenticado",
                security: [
                    {
                        bearerAuth: []
                    }
                ],
                responses: {
                    "200": {
                        description: "Perfil obtenido exitosamente"
                    },
                    "401": {
                        description: "Token inválido"
                    },
                    "403": {
                        description: "Email no verificado"
                    }
                }
            }
        },
        "/auth/profile/by-id": {
            post: {
                tags: ["Profile"],
                summary: "Obtiene el perfil de un usuario por ID",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthProfileByIdRequest"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Perfil obtenido exitosamente"
                    },
                    "400": {
                        description: "userId no proporcionado"
                    },
                    "404": {
                        description: "Usuario no encontrado"
                    }
                }
            }
        }
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            AccountCreateRequest: {
                type: "object",
                required: ["tipoCuenta", "saldo", "moneda"],
                properties: {
                    tipoCuenta: {
                        type: "string",
                        example: "AHORRO",
                        enum: ["AHORRO", "MONETARIA"]
                    },
                    saldo: {
                        type: "number",
                        example: 1500.75
                    },
                    moneda: {
                        type: "string",
                        example: "GTQ",
                        enum: ["GTQ", "USD"]
                    },
                    estado: {
                        type: "boolean",
                        example: true
                    }
                }
            },
            TransactionCreateRequest: {
                type: "object",
                required: ["tipoTransaccion", "monto", "moneda"],
                properties: {
                    tipoTransaccion: {
                        type: "string",
                        example: "TRANSFERENCIA",
                        enum: ["DEPOSITO", "TRANSFERENCIA", "RETIRO"]
                    },
                    monto: {
                        type: "number",
                        example: 250.5
                    },
                    moneda: {
                        type: "string",
                        example: "GTQ",
                        enum: ["GTQ", "USD"]
                    },
                    cuentaOrigen: {
                        type: "string",
                        example: "67b8d2f3d0a1a23c8b91a001"
                    },
                    cuentaDestino: {
                        type: "string",
                        example: "67b8d2f3d0a1a23c8b91a002"
                    },
                    descripcion: {
                        type: "string",
                        example: "Pago de servicio"
                    }
                }
            },
            AuthRegisterRequest: {
                type: "object",
                required: ["name", "email", "password", "phone"],
                properties: {
                    name: {
                        type: "string",
                        example: "Juan Perez"
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "juan@email.com"
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        example: "S3gura123!"
                    },
                    phone: {
                        type: "string",
                        example: "12345678"
                    },
                    profilePicture: {
                        type: "string",
                        format: "binary"
                    }
                }
            },
            AuthLoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "juan@email.com"
                    },
                    password: {
                        type: "string",
                        example: "S3gura123!"
                    }
                }
            },
            AuthTokenRequest: {
                type: "object",
                required: ["token"],
                properties: {
                    token: {
                        type: "string",
                        example: "token_verificacion"
                    }
                }
            },
            AuthEmailRequest: {
                type: "object",
                required: ["email"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "juan@email.com"
                    }
                }
            },
            AuthResetPasswordRequest: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                    token: {
                        type: "string",
                        example: "token_reset"
                    },
                    newPassword: {
                        type: "string",
                        minLength: 8,
                        example: "NuevaClave123!"
                    }
                }
            },
            AuthProfileByIdRequest: {
                type: "object",
                required: ["userId"],
                properties: {
                    userId: {
                        type: "string",
                        example: "d2b3f4a5-1234-4d5e-8f90-123456789abc"
                    }
                }
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ]
};

const options = {
    definition: swaggerDefinition,
    apis: ["./src/**/*.routes.js"]
};

export default swaggerJSDoc(options);