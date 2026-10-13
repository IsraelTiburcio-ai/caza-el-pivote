/*
 * CAZA EL PIVOTE — banco de tablas (Gimnasio 3 · Método Simplex, sección 3.3).
 * Tablas válidas de modelos de maximización con x1, x2, s1, s2 y Sol.
 * La columna z se omite por brevedad. Último renglón: zj − cj.
 * Criterios (cuadernillo, sección 3.3, pp. 14–17): columna con zj−cj más negativo;
 * razón mínima Sol./y solo para y > 0; el elemento pivote es la intersección.
 */
window.CAZA_DATA = {
  titulo: "Caza el pivote",
  columnas: ["x1", "x2", "s1", "s2"],
  rondasPorPartida: 5,
  duracionSeg: 120,
  mezclaPorNivel: { 1: 1, 2: 2, 3: 2 },
  niveles: { 1: "Básico", 2: "Intermedio", 3: "Avanzado" },
  tablas: [
    { id: "T01", nivel: 1, iteracion: 0, base: ["s1", "s2"], filas: [[0,4,1,0,7],[1,6,0,1,12]], zj_cj: [-2,-12,0,0,0], modelo: { c:[2,12], a:[[0,4],[1,6]], b:[7,12] } },
    { id: "T02", nivel: 1, iteracion: 0, base: ["s1", "s2"], filas: [[4,6,1,0,10],[5,1,0,1,15]], zj_cj: [-12,-6,0,0,0], modelo: { c:[12,6], a:[[4,6],[5,1]], b:[10,15] } },
    { id: "T03", nivel: 1, iteracion: 0, base: ["s1", "s2"], filas: [[2,2,1,0,13],[1,2,0,1,11]], zj_cj: [-6,-12,0,0,0], modelo: { c:[6,12], a:[[2,2],[1,2]], b:[13,11] } },
    { id: "T04", nivel: 1, iteracion: 0, base: ["s1", "s2"], filas: [[1,4,1,0,15],[3,5,0,1,8]], zj_cj: [-11,-6,0,0,0], modelo: { c:[11,6], a:[[1,4],[3,5]], b:[15,8] } },
    { id: "T05", nivel: 1, iteracion: 0, base: ["s1", "s2"], filas: [[5,5,1,0,8],[3,6,0,1,16]], zj_cj: [-8,-9,0,0,0], modelo: { c:[8,9], a:[[5,5],[3,6]], b:[8,16] } },
    { id: "T06", nivel: 2, iteracion: 0, base: ["s1", "s2"], filas: [[4,2,1,0,4],[6,4,0,1,5]], zj_cj: [-2,-12,0,0,0], modelo: { c:[2,12], a:[[4,2],[6,4]], b:[4,5] } },
    { id: "T07", nivel: 2, iteracion: 0, base: ["s1", "s2"], filas: [[1,3,1,0,4],[4,2,0,1,9]], zj_cj: [-11,-4,0,0,0], modelo: { c:[11,4], a:[[1,3],[4,2]], b:[4,9] } },
    { id: "T08", nivel: 2, iteracion: 0, base: ["s1", "s2"], filas: [[4,3,1,0,7],[5,6,0,1,8]], zj_cj: [-6,-9,0,0,0], modelo: { c:[6,9], a:[[4,3],[5,6]], b:[7,8] } },
    { id: "T09", nivel: 2, iteracion: 0, base: ["s1", "s2"], filas: [[5,0,1,0,7],[6,5,0,1,11]], zj_cj: [-6,-7,0,0,0], modelo: { c:[6,7], a:[[5,0],[6,5]], b:[7,11] } },
    { id: "T10", nivel: 2, iteracion: 0, base: ["s1", "s2"], filas: [[6,5,1,0,11],[1,0,0,1,10]], zj_cj: [-3,-10,0,0,0], modelo: { c:[3,10], a:[[6,5],[1,0]], b:[11,10] } },
    { id: "T11", nivel: 3, iteracion: 1, base: ["s1", "x2"], filas: [[3,0,1,-2,6],[0,1,0,1,4]], zj_cj: [-2,0,0,3,12], modelo: { c:[2,3], a:[[3,2],[0,1]], b:[14,4] } },
    { id: "T12", nivel: 3, iteracion: 1, base: ["s1", "x1"], filas: [[0,3,1,-2,12],[1,0,0,1,4]], zj_cj: [0,-1,0,2,8], modelo: { c:[2,1], a:[[2,3],[1,0]], b:[20,4] } },
    { id: "T13", nivel: 3, iteracion: 2, base: ["x2", "x1"], filas: [[0,1,3,-1,1],[1,0,-5,2,2]], zj_cj: [0,0,-3,2,10], modelo: { c:[3,4], a:[[1,2],[3,5]], b:[4,11] } },
    { id: "T14", nivel: 3, iteracion: 1, base: ["x1", "s2"], filas: [[1,0,1,0,4],[0,3,-4,1,6]], zj_cj: [0,-1,4,0,16], modelo: { c:[4,1], a:[[1,0],[4,3]], b:[4,22] } },
    { id: "T15", nivel: 3, iteracion: 2, base: ["x1", "x2"], filas: [[1,0,5,-4,6],[0,1,-1,1,1]], zj_cj: [0,0,2,-1,9], modelo: { c:[1,3], a:[[1,4],[1,5]], b:[10,11] } }
  ]
};
