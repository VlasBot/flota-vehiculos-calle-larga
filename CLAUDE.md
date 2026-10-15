# Proyecto:

Aplicación web para gestionar la flota de vehiculos de la municipaldiad de calle larga, la flota de vehículos que mantiene la municipalidad son: buses, camiones, autos, camionetas, motos, micros,etc

Debe tener dos interfaces:
1- interfaz para los administadores de sistema, quienes ingresarán los datos de los vehículos, conductores, planificación de viajes, llevar las matenciones al día, etc. (todo lo necesario para la gestión de flota)
2- interfaz para el conductor, quien debe registrar los datos del vehiculo al momento de iniciar y temrinar el viaje.

# Rol del agente:

Desarrollador web con 12 años de experiencia.

# Objetivo:

Crear una aplicación web para administrar todo lo relacionado a la gestión de vehículos (flota) de la Municipalidad de Calle Larga. gestionar las bitácoras de los conductores al inciar y terminar sus turnos. Tener un perfil para que la secretaria y el encargado de flota pueda administrar todo desde la interfaz web, gestionar los vehiculos y sus matenciones, agendar viajes, gestionar los conductores, etc (todo lo que recomiendes para gestionar la flota de vheiculos municipales con los viajes que se deben realiozar en los vehiculos)



## El sistema debe tener los siguientes perfiles

- Perfil conductor: deben registrar los datos del vehículo antes de iniciar un viaje y al terminar un viaje, registrar todo lo necesario para un viaje, tambien debe indicar si cargo con combustible el vehículo indicando los litros

- Perfil usuario: Es el perfil que usara la secretaria y el encargado de la flota municipal, puden ingresar datos de los vehiculos, los conductores. Pueden planificar los viajes, etc 

- Perfil administrador: puede hacer de todo en el sistema

# Funcionalidades de la aplicación
- Login (supabase)
- Los conductores (con el perfil conductor) pueden acceder al sistema para crear sus bitacoras al inicio de turno y al finalizar el turno (viaje), en esta bitacora tambien pueden ingresar obseravciones y el kilometraje (en el caso que cargarán combustible)
- El usuario con el perfil usuario puede ingresar y actualizar datos en el sistema, tambien puede agregar más usuarios y conductores al sistema, llevar los datos de los vehículos, obtener reportes, etc.
- El perfil usuario tiene acceso total al sistema


# Dashboard:
- El sistema (en el perfil usuairo) debe mostrar una panel dashboard donde puden ver metricas relacionadas a los vehiculos, viajes que se han realizado (Santiago, Viña del mar, Valparaíso, etc)
- Ver metricas (principalmente de los vehículos)
- turnos activos de los conductores 
- vehículos que estan en curso o en viaje  
- vehiculos que estan por vencer la revisión técnica 
- vehículos que esta por vencer la mantención de kilometrajes

## Interfaz del perfil usuario:
- Registro de vehívulos 
- Registro de viajes 
- registrar la mantenciones de los vehículos 
- Gestionar los turnos de los conductores 


## Interfaz perfil conductor: 
- Ingresar información en las bitácores al momento de iniciar y terminar su turno


## En general:

- Protección de rutas
- Validación de solapamiento
- Mensajes de confirmación (al momento de ingresar los procedimientos)


# Stack de tecnologia:

- HTML5

- CSS3 (con tailwind)

- JavaScript

- React

- Base datos y backend: Supabase



# Preferencias generales:

- Todos los textos visibles en la web deben estar en español.



# Preferencias de diseño:

- Basate en la aplicación que realizamos para Seguridad Publica de la Municipaldiad de Calle Larga



# Preferencias de estilos:

- Colores, la paleta de colores de la municipalidad de calle larga son: 
    - #06262d
    - #df1683
    - #80bc00
    - #57b6b2


- Uso de medidas en rem, usando un font-size base de 10px

- Uso de HTML5 y CSS3 nativo.

- Uso de buenas practicas de maquetación css y si es necesario usa flexbox y css grid layout.

- Que la webapp sea responsive.


# Preferencias de código:

- No añadas dependencias externas.

- HTML debe ser semantico.

- Usa siempre let o const, y no uses nunca var.

- No uses alert, confirm o prompt, todo el feedback debe ser visual en el dom.

- Toda alerta o ventana modal que aparezca debe tener el mismo estilo que la web.

- No uses innerHTML, todo el contenido debe ser insertado con appendChild o previamente creando un elemento con document.createElement

- Cuidado con olvidar prevenir el default en los eventos submit o click.

- Prioriza el código legible y mantenible.

- Pririza que el codigo sea sencillo de entender.

- Si el agente duda, que revise las especificaciones del proyecto y si no que pregunte al usuario.



# Estructura de archivos:

- carpeta (design)
- CLAUDE.md
- estructura de ficheros más adecuada para proyectos de react (lo elige el agente de ia)


# Stack final del proyecto 

## Frontend:
React 19 - Framework principal para UI
Vite 8 - Build tool y dev server (súper rápido)
React Router DOM 7 - Para enrutamiento entre páginas

## Backend & Base de datos:
Supabase (PostgreSQL):
Base de datos relacional
Autenticación (Auth)
Row Level Security (RLS) para seguridad
Edge Functions
Storage para fotos

## Estilos:
CSS3 puro - Sin frameworks como Tailwind
Diseño responsivo con Flexbox y CSS Grid
Variables CSS para tokens de diseño
Mobile-first approach

## Lenguaje:
JavaScript ES6+ - Con JSX para React
C
## Características especiales:
Sin dependencias externas (según las preferencias del proyecto)
HTML semántico
Componentes reutilizables (Card, Button, DataTable, Modal, etc.)
Control de estado con hooks (useState, useEffect, useContext)
Validación en base de datos con RLS
Es un stack moderno y limpio, enfocado en mantener el código simple y sin sobrecarga de librerías externas.