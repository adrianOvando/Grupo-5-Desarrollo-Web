 var myModal = document.getElementById("myModal");
        var modalRedactar = document.getElementById("modalRedactar");
        var btnEntrada = document.getElementById("btn-entrada");
        var btnSalida = document.getElementById("btn-salida");
        var btnBorradores = document.getElementById("btn-borradores");
        var btnRedactar = document.getElementById("btn-redactar");
        var btnSalir = document.getElementById("btn-salir");
        var tablaBandeja = document.getElementById("tabla-bandeja");
        var btnGuardar = document.getElementById("btn-guardar");
        var btnEnviar = document.getElementById("btn-enviar");
        var btnCancelarRedactar = document.getElementById("btn-cancelar-redactar");

        var spansCerrar = document.getElementsByClassName("close");
        for (var i = 0; i < spansCerrar.length; i++) {
            spansCerrar[i].onclick = function() {
                myModal.style.display = "none";
                modalRedactar.style.display = "none";
            }
        }

        window.onload = function() {
            verificarAutenticacion();
            
            btnEntrada.onclick = function() {
                cargarBandejaEntrada();
                actualizarBotones('entrada');
            };
            
            btnSalida.onclick = function() {
                cargarBandejaSalida();
                actualizarBotones('salida');
            };
            
            btnBorradores.onclick = function() {
                cargarBorradores();
                actualizarBotones('borradores');
            };
            
            btnRedactar.onclick = mostrarRedactarModal;
            btnSalir.onclick = cerrarSesion;
            btnCancelarRedactar.onclick = function() {
                modalRedactar.style.display = "none";
            };
            
            cargarBandejaEntrada();
            actualizarBotones('entrada');
        };

        function actualizarBotones(bandejaActiva) {
            btnEntrada.className = 'boton boton-inactivo';
            btnSalida.className = 'boton boton-inactivo';
            btnBorradores.className = 'boton boton-inactivo';
            
            if (bandejaActiva === 'entrada') {
                btnEntrada.className = 'boton boton-activo';
            } else if (bandejaActiva === 'salida') {
                btnSalida.className = 'boton boton-activo';
            } else if (bandejaActiva === 'borradores') {
                btnBorradores.className = 'boton boton-activo';
            }
        }

        function verificarAutenticacion() {
            fetch('api/auth/check.php')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    if (!data.loggedIn || data.role !== 'user') {
                        window.location.href = 'login.html';
                    }
                });
        }

        function cerrarSesion() {
            fetch('api/auth/logout.php')
                .then(function() {
                    window.location.href = 'login.html';
                });
        }

        function cargarBandejaEntrada() {
            fetch('api/mail/inbox.php')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    mostrarBandeja(data, 'entrada');
                });
        }

        function cargarBandejaSalida() {
            fetch('api/mail/sent.php')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    mostrarBandeja(data, 'salida');
                });
        }

        function cargarBorradores() {
            fetch('api/mail/drafts.php')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    mostrarBorradores(data);
                });
        }

        function mostrarBandeja(correos, tipo) {
            var tbody = tablaBandeja.getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            
            for (var i = 0; i < correos.length; i++) {
                var correo = correos[i];
                var fila = document.createElement('tr');
                
                if (tipo === 'entrada' && correo.leido) {
                    fila.classList.add('correo-leido');
                }
                if (tipo === 'salida' && correo.estado === 'enviado') {
                    fila.classList.add('correo-enviado');
                }
                
                fila.innerHTML = `
                    <td>${tipo === 'entrada' ? correo.remitente : correo.destinatario}</td>
                    <td>${correo.asunto}</td>
                    <td>${correo.estado}</td>
                    <td>
                        <button class="boton" onclick="verCorreo(${correo.id}, '${tipo}')">Ver</button>
                        <button class="boton boton-peligro" onclick="eliminarCorreo(${correo.id}, '${tipo}')">Eliminar</button>
                    </td>
                `;
                
                tbody.appendChild(fila);
            }
        }

        function mostrarBorradores(correos) {
            var tbody = tablaBandeja.getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            
            for (var i = 0; i < correos.length; i++) {
                var correo = correos[i];
                var fila = document.createElement('tr');
                
                fila.innerHTML = `
                    <td>${correo.destinatario}</td>
                    <td>${correo.asunto}</td>
                    <td>Borrador</td>
                    <td>
                        <button class="boton" onclick="editarBorrador(${correo.id})">Editar</button>
                        <button class="boton boton-accion" onclick="enviarBorrador(${correo.id})">Enviar</button>
                        <button class="boton boton-peligro" onclick="eliminarCorreo(${correo.id}, 'borrador')">Eliminar</button>
                    </td>
                `;
                
                tbody.appendChild(fila);
            }
        }

        function verCorreo(id, tipo) {
            fetch('api/mail/get.php?id=' + id + '&tipo=' + tipo)
                .then(function(response) {
                    return response.json();
                })
                .then(function(correo) {
                    document.getElementById("titulo-modal").textContent = correo.asunto;
                    
                    var contenidoModal = document.getElementById("contenido-modal");
                    contenidoModal.innerHTML = `
                        <div class="email-info">
                            <p><strong>De:</strong> ${correo.remitente}</p>
                            <p><strong>Para:</strong> ${correo.destinatario}</p>
                            <p><strong>Fecha:</strong> ${correo.fecha}</p>
                        </div>
                        <hr>
                        <div class="email-content">
                            ${correo.contenido}
                        </div>
                    `;
                    
                    myModal.style.display = "block";
                    
                    if (tipo === 'entrada' && !correo.leido) {
                        marcarComoLeido(id);
                        var filas = tablaBandeja.getElementsByTagName('tr');
                        for (var j = 0; j < filas.length; j++) {
                            var btn = filas[j].querySelector('button[onclick*="verCorreo(' + id + '"]');
                            if (btn) {
                                filas[j].classList.add('correo-leido');
                                break;
                            }
                        }
                    }
                });
        }

        function marcarComoLeido(id) {
            fetch('api/mail/mark_read.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: id })
            });
        }

        function eliminarCorreo(id, tipo) {
            if (confirm('¿Estás seguro de eliminar este correo?')) {
                fetch('api/mail/delete.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: id, tipo: tipo })
                })
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    if (data.success) {
                        if (btnEntrada.className.includes('boton-activo')) {
                            cargarBandejaEntrada();
                        } else if (btnSalida.className.includes('boton-activo')) {
                            cargarBandejaSalida();
                        } else {
                            cargarBorradores();
                        }
                    }
                });
            }
        }

        function enviarBorrador(id) {
            if (confirm('¿Estás seguro de enviar este borrador?')) {
                fetch('api/mail/send_draft.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: id })
                })
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    if (data.success) {
                        cargarBorradores();
                    }
                });
            }
        }

        function editarBorrador(id) {
            fetch('api/mail/get.php?id=' + id + '&tipo=borrador')
                .then(function(response) {
                    return response.json();
                })
                .then(function(correo) {
                    document.getElementById("redactar-destinatario").value = correo.destinatario;
                    document.getElementById("redactar-asunto").value = correo.asunto;
                    document.getElementById("redactar-contenido").value = correo.contenido;
                    document.getElementById("redactar-id").value = correo.id;
                    
                    modalRedactar.style.display = "block";
                });
        }

        function mostrarRedactarModal() {
            document.getElementById("formulario-redactar").reset();
            document.getElementById("redactar-id").value = '';
            modalRedactar.style.display = "block";
        }

        window.onclick = function(event) {
            if (event.target == myModal) {
                myModal.style.display = "none";
            }
            if (event.target == modalRedactar) {
                modalRedactar.style.display = "none";
            }
        };