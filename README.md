# CAZA EL PIVOTE

**Encuentra columna, renglón y elemento pivote** — microjuego educativo web para Gimnasio 3: Método Simplex.

## Objetivo

Practicar la lectura de una tabla simplex de maximización: identificar la columna pivote (variable entrante), el renglón pivote (variable saliente) mediante la razón mínima y el elemento pivote en su intersección. El reto se enfoca en reconocer la estructura, no en hacer cálculos extensos.

## Fuente académica

- **Gimnasio 3, sección 3.3: Método Simplex**, cuadernillo *Optimización 1* (pp. 9–28; criterios y tabla simplex, pp. 14–17).
- Se conserva su notación `zⱼ − cⱼ`, `Sol.`, θ, variable de entrada/salida, columna pivote, renglón pivote y elemento pivote.
- Para maximización, entra la variable con el `zⱼ − cⱼ` más negativo. El renglón pivote se determina con `θ = Sol. / yᵢ`, considerando solo `yᵢ > 0`. El elemento pivote es la intersección.
- La columna `z` se omite para mantener la tabla compacta; no cambia la selección. Los 15 tableaux se derivan de modelos pequeños y cada respuesta se verifica con su modelo de origen.

## Mecánica

En cada tabla, el jugador resuelve una secuencia guiada de tres toques:

1. Seleccionar la columna pivote.
2. Seleccionar el renglón pivote comparando las razones válidas.
3. Marcar el elemento pivote.

La partida presenta **5 tablas** de un banco de **15 retos** (5 por nivel). Los errores dan una pista correctiva y permiten volver a intentar; tras dos errores en un paso se habilita **Ver respuesta**. Hay pistas, reproducción, pausa y sonido opcional.

## Duración y puntuación

- Hasta **120 segundos** por partida; una partida normal dura aproximadamente **60–120 segundos**, según el ritmo de respuesta.
- Se registran tablas completadas, aciertos al primer intento, errores, tiempo, racha y puntos.
- Cada selección correcta vale 100 puntos al primer intento o 50 tras error/pista. Mostrar la respuesta no suma puntos.

## Stack

HTML semántico, CSS responsive y JavaScript vanilla. Los sonidos se sintetizan con Web Audio; mute, récord y preferencias se guardan con `localStorage`. No hay dependencias de producción.

## Uso local

Clona el repositorio o descarga los archivos y sirve la carpeta desde un servidor HTTP:

```bash
python3 -m http.server 8000
```

Abre <http://localhost:8000>. También puede abrirse `index.html` directamente en navegadores modernos.

## GitHub Pages

URL de producción: <https://israeltiburcio-ai.github.io/caza-el-pivote/>

El workflow `.github/workflows/pages.yml` publica automáticamente el sitio en cada push a `main`.
