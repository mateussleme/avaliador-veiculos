// Tabela de descontos por marca e modelo.
// Gerada automaticamente da planilha Tabela_Fipe_-_Tabela_desconto_para_compra.xlsx
//
// Para adicionar novos modelos: insira uma nova linha em DISCOUNT_TABLE no formato
//   { brand: "Marca", model: "Modelo", discount: 0.XX }, // XX%
//
// Modelos não listados usam DEFAULT_DISCOUNT_PERCENT (-22%).

export interface DiscountEntry {
  brand: string;
  model: string;
  discount: number; // ex: 0.20 = 20% de desconto sobre o valor FIPE
  // Média de km/ano esperada para o modelo (coluna "KM Média Ano" das
  // planilhas). Usada pelo motor para deixar o ajuste de quilometragem
  // relativo ao modelo. Se ausente, o motor usa o padrão (12.000 km/ano).
  kmPerYear?: number;
}

export const DEFAULT_DISCOUNT_PERCENT = 22;

// ---- Tabela principal — edite aqui para adicionar ou ajustar modelos ----
export const DISCOUNT_TABLE: DiscountEntry[] = [
  // BMW
  { brand: "BMW", model: "118i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "120i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "218i", discount: 0.25 }, // 25% (todas as 218: M Sport e Sport GP)
  { brand: "BMW", model: "220i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "320i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "328i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "330e", discount: 0.25 }, // 25%
  { brand: "BMW", model: "330i", discount: 0.25 }, // 25%
  { brand: "BMW", model: "420i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "430i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "530e", discount: 0.25 }, // 25%
  { brand: "BMW", model: "530i", discount: 0.23 }, // 23%
  { brand: "BMW", model: "540i", discount: 0.23 }, // 23%
  // Variantes automáticas antigas com sufixo "iA" grudado ("320iA", "328iA"...),
  // mesmo carro do modelo sem "iA". A FIPE também usa "530i/iA"/"540i/iA" com
  // barra, que já casam com "530i"/"540i" — aqui cobrimos só a grafia grudada.
  { brand: "BMW", model: "118ia", discount: 0.22 }, // 22% (= 118i)
  { brand: "BMW", model: "120ia", discount: 0.22 }, // 22% (= 120i)
  { brand: "BMW", model: "320ia", discount: 0.22 }, // 22% (= 320i)
  // Trims do 320i (tokens com "320ia" nao vazam para outros modelos):
  //  - Sport / GT Sport / Modern-Sport e as /GP -> 25%
  //  - M Sport -> 22% (mais especifico, vence o "320iA Sport")
  { brand: "BMW", model: "320iA Sport", discount: 0.25 }, // 25% — GT Sport, Modern/Sport
  { brand: "BMW", model: "320iA Gp", discount: 0.25 },    // 25% — versoes "/GP"
  { brand: "BMW", model: "320iA M Sport", discount: 0.22 }, // 22% — M Sport
  { brand: "BMW", model: "328ia", discount: 0.22 }, // 22% (= 328i)
  { brand: "BMW", model: "330ia", discount: 0.25 }, // 25% (= 330i)
  { brand: "BMW", model: "540ia", discount: 0.23 }, // 23% (= 540i)
  { brand: "BMW", model: "730li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "745le", discount: 0.3 }, // 30%
  { brand: "BMW", model: "750li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "750i", discount: 0.3 }, // 30%
  // A FIPE grafa o 750Li como "750iL" / "750iLA" — mesmo carro do 750Li.
  { brand: "BMW", model: "750il", discount: 0.3 }, // 30%
  { brand: "BMW", model: "750ila", discount: 0.3 }, // 30%
  { brand: "BMW", model: "I4", discount: 0.3 }, // 30%
  { brand: "BMW", model: "M 135i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M 140i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M 235i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M 240i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M 340i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M 440i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M 760li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "M 850i", discount: 0.35 }, // 35%
  // A FIPE também grafa esses M sem espaço ("M140i", "M340i", "M760Li",
  // "M850i"...). Mesmo carro, mesma taxa — sem estas entradas caíam em 20%.
  { brand: "BMW", model: "M135i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M140i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M235i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M240i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M340i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M440i", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M760li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "M850i", discount: 0.35 }, // 35%
  { brand: "BMW", model: "M2", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M3", discount: 0.25 }, // 25%
  { brand: "BMW", model: "M4", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M5", discount: 0.22 }, // 22%
  { brand: "BMW", model: "M6", discount: 0.35 }, // 35%
  { brand: "BMW", model: "M8", discount: 0.35 }, // 35%
  { brand: "BMW", model: "X1", discount: 0.22 }, // 22%
  { brand: "BMW", model: "X2", discount: 0.22 }, // 22%
  { brand: "BMW", model: "X3", discount: 0.25 }, // 25%
  { brand: "BMW", model: "X4", discount: 0.22 }, // 22%
  { brand: "BMW", model: "X5", discount: 0.25 }, // 25%
  { brand: "BMW", model: "X6", discount: 0.27 }, // 27%
  { brand: "BMW", model: "X7", discount: 0.3 }, // 30%
  { brand: "BMW", model: "Z4", discount: 0.22 }, // 22%
  { brand: "BMW", model: "I3", discount: 0.25 }, // 25%
  { brand: "BMW", model: "I5", discount: 0.3 }, // 30%
  { brand: "BMW", model: "I7", discount: 0.35 }, // 35%
  { brand: "BMW", model: "I8", discount: 0.35 }, // 35%
  { brand: "BMW", model: "Ix", discount: 0.35 }, // 35%
  { brand: "BMW", model: "Ix1", discount: 0.25 }, // 25%
  { brand: "BMW", model: "Ix2", discount: 0.3 }, // 30%
  { brand: "BMW", model: "Ix3", discount: 0.3 }, // 30%

  // BMW motos — linha "RT" (touring): R 1200 RT, R 1250 RT e variantes/trims
  // (ex: "R 1250 RT Premium Spezial"). O match é por palavra completa "Rt",
  // então cobre qualquer versão/trim contanto que a FIPE escreva "RT" com
  // espaço antes (não gruda em "R1250RT" sem espaço).
  { brand: "BMW", model: "Rt", discount: 0.25 }, // 25%

  // Land Rover
  { brand: "Land Rover", model: "Defender", discount: 0.22 }, // 22%
  // A FIPE abrevia Defender como "Def." e "Defe." (ex: "Def. 90 X-DY",
  // "Defe. 110 X-DY", "Defe. 130 Outbound") — sem estas entradas essas
  // versões caíam no padrão de 20%.
  { brand: "Land Rover", model: "Def", discount: 0.22 }, // 22% — "Def. 90"
  { brand: "Land Rover", model: "Defe", discount: 0.22 }, // 22% — "Defe. 110/130"
  { brand: "Land Rover", model: "Discovery", discount: 0.30 }, // 30%
  { brand: "Land Rover", model: "Discovery3", discount: 0.30 }, // 30%
  { brand: "Land Rover", model: "Discovery4", discount: 0.30 }, // 30%
  { brand: "Land Rover", model: "Discovery Sport", discount: 0.30 }, // 30%
  // Discovery Sport abreviado pela FIPE: "Disc. Sp." e "Discov. Sp." — mesma
  // taxa do Discovery Sport (30%). "sp" só casa junto de "disc"/"discov".
  { brand: "Land Rover", model: "Disc Sp", discount: 0.30 }, // 30% — "Disc. Sp."
  { brand: "Land Rover", model: "Discov Sp", discount: 0.30 }, // 30% — "Discov. Sp."
  { brand: "Land Rover", model: "Discov Metrop", discount: 0.28 }, // 28% — "Discov. Metrop." (FIPE abrevia)
  { brand: "Land Rover", model: "Range Rover", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Range Rover Evoque", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Evoque", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "EVO", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Range Rover Sport", discount: 0.3 }, // 30%
  { brand: "Land Rover", model: "Range Rover Velar", discount: 0.3 }, // 30%
  { brand: "Land Rover", model: "Range Rover Vogue", discount: 0.3 }, // 30%
  // A FIPE abrevia a maior parte da linha Range Rover como "Range R." —
  // ex: "Range R. Sport Autob.", "Range R. Sp. Dyn. HSE", "Range R.Sp.
  // First.Ed", "Range.R. SP.HSE", "Range R. VELAR HSE", "Range R. VEL.
  // R-Dyn.", "Range R. Vogue", "Range R. Autobio." (o Range Rover "cheio").
  // Como o normalize() troca pontuação por espaço, esses nomes viram
  // "range r sport", "range r sp", "range r vel"... — e as entradas acima,
  // que exigem a palavra "rover", NÃO casam com eles (cairiam no padrão
  // de 20%). As entradas abaixo cobrem as abreviações; a regra do match
  // mais específico garante que "Range R Sport" (3 tokens) vence
  // "Range R" (2 tokens) quando ambas couberem.
  { brand: "Land Rover", model: "Range R", discount: 0.25 }, // 25% — base, espelho de "Range Rover"
  { brand: "Land Rover", model: "Range R Sport", discount: 0.3 }, // 30%
  { brand: "Land Rover", model: "Range R Sp", discount: 0.3 }, // 30% — "Range R. Sp." / "Range.R. SP."
  { brand: "Land Rover", model: "Range R Vel", discount: 0.3 }, // 30% — "Range R. VEL."
  { brand: "Land Rover", model: "Range R Velar", discount: 0.3 }, // 30%
  { brand: "Land Rover", model: "Range R Vogue", discount: 0.3 }, // 30%
  // SV Autobiography (topo de linha, LWB) — desconto maior, 40%. Os tokens
  // "sv" + "autob" miram so essa versao: nao casam com "Autobio." (comum, 25%),
  // nem com "Sport Autob." (Sport, 30%), nem com "SVR" (token "svr" != "sv").
  { brand: "Land Rover", model: "Range R Sv Autob", discount: 0.40 }, // 40% — "Range R. SV Autob."
  { brand: "Land Rover", model: "Range R Sv Autobiography", discount: 0.40 }, // 40% — grafia por extenso

  // Audi
  { brand: "Audi", model: "A1", discount: 0.22 }, // 22% (mantido — não veio na planilha nova)
  // A3: TODAS as versões a 27% (Sedan, Sportback, cabriolet, hatch...). O token
  // "a3" cobre todas as grafias da FIPE, sem colidir com A1/A4/A5.
  { brand: "Audi", model: "A3", discount: 0.27, kmPerYear: 8000 }, // 27% (todas as A3)
  { brand: "Audi", model: "A4", discount: 0.28, kmPerYear: 8000 }, // 28%
  { brand: "Audi", model: "A5", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "A6", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "A6 E-tron", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "A7", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "A8", discount: 0.35 }, // 35% (mantido — não veio na planilha)
  { brand: "Audi", model: "E-tron", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "E-tron Gt", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "Q3", discount: 0.25, kmPerYear: 8000 }, // 25%
  { brand: "Audi", model: "Q5", discount: 0.28, kmPerYear: 8000 }, // 28%
  { brand: "Audi", model: "Q6 E-tron", discount: 0.25, kmPerYear: 8000 }, // 25%
  { brand: "Audi", model: "Q7", discount: 0.28, kmPerYear: 8000 }, // 28%
  { brand: "Audi", model: "Q8", discount: 0.28, kmPerYear: 8000 }, // 28%
  { brand: "Audi", model: "Q8 E-tron", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "R8", discount: 0.25, kmPerYear: 3000 }, // 25%
  { brand: "Audi", model: "Rs E-tron Gt", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "Rs Q3", discount: 0.28, kmPerYear: 4000 }, // 28%
  { brand: "Audi", model: "Rs Q8", discount: 0.28, kmPerYear: 4000 }, // 28%
  { brand: "Audi", model: "Rs3", discount: 0.3 }, // 30% (mantido — não veio na planilha)
  { brand: "Audi", model: "Rs4", discount: 0.3, kmPerYear: 4000 }, // 30%
  { brand: "Audi", model: "Rs5", discount: 0.25, kmPerYear: 3000 }, // 25%
  { brand: "Audi", model: "Rs6", discount: 0.25, kmPerYear: 3000 }, // 25%
  { brand: "Audi", model: "Rs7", discount: 0.25, kmPerYear: 3000 }, // 25%
  { brand: "Audi", model: "Sq5", discount: 0.25, kmPerYear: 3000 }, // 25%
  { brand: "Audi", model: "Sq6 E-tron", discount: 0.35 }, // 35% (mantido — não veio na planilha)
  { brand: "Audi", model: "Sq8 E-tron", discount: 0.3, kmPerYear: 8000 }, // 30%
  { brand: "Audi", model: "Tt", discount: 0.25 }, // 25% (mantido)
  { brand: "Audi", model: "Tt Rs", discount: 0.25, kmPerYear: 4000 }, // 25%
  { brand: "Audi", model: "Tts", discount: 0.25 }, // 25% (mantido)

  // Mercedez-Benz
  { brand: "Mercedez-Benz", model: "A 200", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "A 250", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "A 35 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "A 45 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Amg Gt", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Amg Gt 43", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Amg Gt 63", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "B 200", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 180", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 200", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 250", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 300", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 43 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Cla 180", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Cla 200", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Cla 250", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Cla 35 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Cla 45 Amg", discount: 0.23 }, // 23%
  { brand: "Mercedez-Benz", model: "Cls 400", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Cls 450", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Cls 53 Amg", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "E 250", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "E 300", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "E 43 Amg", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "E 53 Amg", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "E 63 Amg", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Eqa 250", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqb 250", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqb 250+", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqb 350", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqc 400", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqe 300", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqe 300 Suv", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqe 350+", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqe 350+ Suv", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqe 53 Amg Suv", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqs 450 Suv", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqs 450+ Suv", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Eqs 53 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "G 63 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Gla 200", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Gla 250", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Gla 35 Amg", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Gla 45 Amg", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Glb 200", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Glb 220", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Glb 35 Amg", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Glc 220d", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Glc 250", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Glc 300", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Glc 43 Amg", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Glc 63 Amg", discount: 0.3 }, // 30%
  // TODAS as versoes GLE -> 35%. Um unico token "gle" cobre 350/400/450/53/63,
  // Coupe e trims futuros. Nao colide com GLS/GLC/GLA/GLB (palavras diferentes).
  { brand: "Mercedez-Benz", model: "Gle", discount: 0.35 }, // 35%
  // Especifica para o "GLE 63 AMG S": o "S" solto casaria com o S-Class
  // "S 63 Amg" (3 tokens) e venceria o "Gle" (1 token). Esta entrada empata em
  // 3 tokens e, por vir antes na tabela, vence -> mantem o GLE 63 em 35%.
  { brand: "Mercedez-Benz", model: "Gle 63 Amg", discount: 0.35 }, // 35%
  { brand: "Mercedez-Benz", model: "Gls 350", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gls 450", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gls 600", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Gls 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Metris", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "S 560", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 560l", discount: 0.3 }, // 30% — FIPE grafa "S-560L" (o "L" gruda no número)
  { brand: "Mercedez-Benz", model: "S 580", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 65 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 680", discount: 0.35 }, // 35%
  { brand: "Mercedez-Benz", model: "Sl 400", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Sl 63 Amg", discount: 0.35 }, // 35%
  { brand: "Mercedez-Benz", model: "Slc 300", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Slc 43 Amg", discount: 0.35 }, // 35%

  // Volvo
  { brand: "Volvo", model: "C40", discount: 0.22 }, // 22%
  { brand: "Volvo", model: "Ec40", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Ex30", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Ex40", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Ex90", discount: 0.35 }, // 35%
  { brand: "Volvo", model: "S60", discount: 0.3 }, // 30%
  { brand: "Volvo", model: "S90", discount: 0.35 }, // 35%
  { brand: "Volvo", model: "V40", discount: 0.3 }, // 30%
  { brand: "Volvo", model: "V60", discount: 0.3 }, // 30%
  { brand: "Volvo", model: "Xc40", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Xc60", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Xc90", discount: 0.3 }, // 30%
  // A FIPE grafa a linha XC com espaço ("XC 60 T-8...", "XC 40 T-5...",
  // "XC 90 T-8..."), então as entradas sem espaço acima não casavam com
  // nenhum modelo real — tudo caía no padrão de 20%. As entradas abaixo
  // cobrem a grafia real; as sem espaço ficam por segurança.
  { brand: "Volvo", model: "Xc 40", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Xc 60", discount: 0.25 }, // 25%
  { brand: "Volvo", model: "Xc 90", discount: 0.3 }, // 30%
  // Confirmado ao vivo na FIPE (código 9937): "XC 60 T-8 Pol. Eng. 2.0 AWD
  // (Híbrido)" — o trim Polestar Engineered pedido pelo cliente. 6 tokens,
  // vence "Xc 60" (2 tokens) pela regra do match mais específico.
  { brand: "Volvo", model: "Xc 60 T-8 Pol Eng", discount: 0.3 }, // 30%

  // Toyota
  { brand: "Toyota", model: "Camry", discount: 0.3 }, // 30%
  { brand: "Toyota", model: "Corolla", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Corolla Cross", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Etios", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Etios Cross", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Gr Corolla", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Gr Yaris", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Hiace", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Hilux", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Hilux Sw4", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Prius", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Rav4", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Sienna", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Supra", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Tundra", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Yaris", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Yaris Cross", discount: 0.22 }, // 22%

  // Honda
  { brand: "Honda", model: "Accord", discount: 0.3 }, // 30%
  { brand: "Honda", model: "City", discount: 0.22 }, // 22%
  { brand: "Honda", model: "Civic", discount: 0.22 }, // 22%
  // CR-V: só a versão Híbrida tem 25%. Confirmado ao vivo na FIPE que hoje
  // só existe UMA versão "(Híbrido)" ("CR-V Touring 2.0 16V AWD Aut.(Híbrido)");
  // as demais versões (2.0/2.4 a combustão) caem no padrão de 20%.
  { brand: "Honda", model: "Cr-v Hibrido", discount: 0.25 }, // 25%
  { brand: "Honda", model: "Fit", discount: 0.22 }, // 22%
  { brand: "Honda", model: "Hr-v", discount: 0.22 }, // 22%
  { brand: "Honda", model: "Wr-v", discount: 0.22 }, // 22%
  { brand: "Honda", model: "Zr-v", discount: 0.22 }, // 22%

  // Fiat
  { brand: "Fiat", model: "500", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "500e", discount: 0.3 }, // 30%
  { brand: "Fiat", model: "Argo", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Cronos", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Doblò", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Ducato", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Fastback", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Fiorino", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Grand Siena", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Mobi", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Palio", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Pulse", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Punto", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Scudo", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Strada", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Titano", discount: 0.25 }, // 25%
  { brand: "Fiat", model: "Topolino", discount: 0.25 }, // 25%
  { brand: "Fiat", model: "Toro", discount: 0.22 }, // 22%
  { brand: "Fiat", model: "Uno", discount: 0.22 }, // 22%

  // Chevrolet
  { brand: "Chevrolet", model: "Blazer Ev", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Bolt", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Bolt Euv", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Camaro", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Captiva", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Captiva Ev", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Cobalt", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Corvette", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Cruze", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Equinox", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Equinox Ev", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Joy", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Montana", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Onix", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Prisma", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "S10", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Silverado", discount: 0.25 }, // 25%
  { brand: "Chevrolet", model: "Spark Euv", discount: 0.25 }, // 25%
  { brand: "Chevrolet", model: "Spin", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Suburban", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Tracker", discount: 0.22 }, // 22%
  { brand: "Chevrolet", model: "Trailblazer", discount: 0.25 }, // 25%

  // Volkswagen
  { brand: "Volkswagen", model: "Amarok", discount: 0.25 }, // 25% — todas as versões/trims
  { brand: "Volkswagen", model: "Crossfox", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Delivery Express", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Fox", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Gol", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Golf", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Id.buzz", discount: 0.25 }, // 25%
  { brand: "Volkswagen", model: "Jetta", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Nivus", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Passat", discount: 0.3 }, // 30%
  { brand: "Volkswagen", model: "Polo", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Saveiro", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Spacefox", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "T-cross", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Taos", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Tera", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Tiguan", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Touareg", discount: 0.35 }, // 35%
  { brand: "Volkswagen", model: "Up", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Virtus", discount: 0.22 }, // 22%
  { brand: "Volkswagen", model: "Voyage", discount: 0.22 }, // 22%

  // Mitsubish
  { brand: "Mitsubish", model: "Asx", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Eclipse Cross", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "L200 Outdoor", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "L200 Savana", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "L200 Triton", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Lancer", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Outlander", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Outlander Sport", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Pajero", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Pajero Dakar", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Pajero Full", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Pajero Sport", discount: 0.22 }, // 22%
  { brand: "Mitsubish", model: "Triton", discount: 0.22 }, // 22%

  // Porsche
  { brand: "Porsche", model: "718", discount: 0.25 }, // 25%
  { brand: "Porsche", model: "911", discount: 0.25 }, // 25%
  { brand: "Porsche", model: "Cayenne", discount: 0.3 }, // 30%
  { brand: "Porsche", model: "Cayene", discount: 0.3 }, // 30% — a FIPE tem um "Cayene" (typo, sem um "n")
  { brand: "Porsche", model: "Macan", discount: 0.22 }, // 22%
  { brand: "Porsche", model: "Panamera", discount: 0.25 }, // 25%
  { brand: "Porsche", model: "Taycan", discount: 0.3 }, // 30%

  // BYD
  { brand: "BYD", model: "Dolphin", discount: 0.22 }, // 22%
  { brand: "BYD", model: "Dolphin Mini", discount: 0.22 }, // 22%
  { brand: "BYD", model: "Han", discount: 0.3 }, // 30%
  { brand: "BYD", model: "King", discount: 0.22 }, // 22%
  { brand: "BYD", model: "Seal", discount: 0.28 }, // 28%
  { brand: "BYD", model: "Shark", discount: 0.28 }, // 28%
  { brand: "BYD", model: "Song Plus", discount: 0.22 }, // 22%
  { brand: "BYD", model: "Song Plus Premium", discount: 0.22 }, // 22%
  { brand: "BYD", model: "Song Pro", discount: 0.22 }, // 22%
  { brand: "BYD", model: "Tan", discount: 0.3 }, // 30%
  { brand: "BYD", model: "Yuan Plus", discount: 0.25 }, // 25%
  { brand: "BYD", model: "Yuan Pro", discount: 0.25 }, // 25%

  // Ford
  { brand: "Ford", model: "Bronco Sport", discount: 0.22 }, // 22%
  { brand: "Ford", model: "E-transit", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Ecosport", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Edge", discount: 0.25 }, // 25%
  { brand: "Ford", model: "Escape", discount: 0.25 }, // 25%
  { brand: "Ford", model: "F-150", discount: 0.22 }, // 22%
  { brand: "Ford", model: "F-250", discount: 0.22 }, // 22%
  { brand: "Ford", model: "F-350", discount: 0.22 }, // 22%
  { brand: "Ford", model: "F-4000", discount: 0.22 }, // 22%
  { brand: "Ford", model: "F-450", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Fiesta", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Focus", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Fusion", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Gt", discount: 0.25 }, // 25%
  { brand: "Ford", model: "Ka", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Ka +", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Maverick", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Mustang", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Mustang Mach-e", discount: 0.35 }, // 35%
  { brand: "Ford", model: "Ranger", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Territory", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Transit", discount: 0.22 }, // 22%

  // Nissan
  { brand: "Nissan", model: "Frontier", discount: 0.25 }, // 25%
  { brand: "Nissan", model: "Kait", discount: 0.22 }, // 22%
  { brand: "Nissan", model: "Kicks", discount: 0.22 }, // 22%
  { brand: "Nissan", model: "Kicks Play", discount: 0.22 }, // 22%
  { brand: "Nissan", model: "Leaf", discount: 0.3 }, // 30%
  { brand: "Nissan", model: "March", discount: 0.22 }, // 22%
  { brand: "Nissan", model: "Sentra", discount: 0.22 }, // 22%
  { brand: "Nissan", model: "Versa", discount: 0.22 }, // 22%
  { brand: "Nissan", model: "Z", discount: 0.3 }, // 30%

  // Caoa Chery
  { brand: "Caoa Chery", model: "Arrizo 5", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Arrizo 6", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Arrizo 6 Pro", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Qq", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Tiggo 2", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 3x", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 5x Pro", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 5x", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 7", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 7 Pro", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 8", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Tiggo 8 Pro", discount: 0.22 }, // 22%
  { brand: "Caoa Chery", model: "Icar", discount: 0.25 }, // 25%

  // Hyundai
  { brand: "Hyundai", model: "Azera", discount: 0.25 }, // 25%
  { brand: "Hyundai", model: "Creta", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Elantra", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Hb20", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Hb20s", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Hb20x", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Hr", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Ioniq", discount: 0.25 }, // 25%
  { brand: "Hyundai", model: "Ioniq 5", discount: 0.28 }, // 28%
  { brand: "Hyundai", model: "Ix35", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Kona", discount: 0.22 }, // 22%
  { brand: "Hyundai", model: "Palisade", discount: 0.28 }, // 28%
  { brand: "Hyundai", model: "Santa Fé", discount: 0.25 }, // 25%
  { brand: "Hyundai", model: "Tucson", discount: 0.22 }, // 22%

  // GWM
  { brand: "GWM", model: "Haval H6", discount: 0.22 }, // 22%
  { brand: "GWM", model: "Haval H6 Gt", discount: 0.22 }, // 22%
  { brand: "GWM", model: "Haval H9", discount: 0.22 }, // 22%
  { brand: "GWM", model: "Ora 03", discount: 0.22 }, // 22%
  { brand: "GWM", model: "Poer P30", discount: 0.22 }, // 22%
  { brand: "GWM", model: "Tank 300", discount: 0.22 }, // 22%
  { brand: "GWM", model: "Wey 07", discount: 0.25 }, // 25%

  // Mini
  // Confirmado ao vivo na FIPE (marca "MINI", código 156): existe o modelo
  // exato "COOPER John Works 2.0 Turbo 3p Aut." (código 7357). O match por
  // palavra completa também cobre as edições especiais que usam a mesma
  // mecânica ("... GP3 2.0 Turbo 3p Aut.", "... 25K Edit. 2.0 Turbo 3p") —
  // ambas recebem 22% também, já que são a mesma versão John Works 2.0 Turbo.
  { brand: "Mini", model: "Cooper John Works 2.0 Turbo 3p", discount: 0.22 }, // 22%
  // Edição especial JCW 2.0 Turbo 3p que a FIPE grafa "John.W.Pat.Moss"
  // (abrevia "Works" para "W"), o que não casa com a entrada acima.
  { brand: "Mini", model: "Cooper Pat Moss", discount: 0.22 }, // 22%
  // ELETRICOS da Mini -> 30%. A FIPE rotula os eletricos com "(Elétrico)" no
  // nome (normalizado vira a palavra "eletrico"), entao um unico token cobre
  // todos: Cooper SE (e variacoes), Cooper E 3p, Countryman SE ALL4 eletrico e
  // Aceman E/SE. NAO pega os hibridos, que a FIPE marca "(Híb.)" -> "hib".
  // Cresce sozinho com novos eletricos rotulados.
  { brand: "Mini", model: "Eletrico", discount: 0.30 }, // 30%
  // JCW eletricos que a FIPE NAO rotula com "(Elétrico)" (so o "E"):
  // "COOPER John Works E 3p" e "COOPER John Works Aceman E 5p". O token "e"
  // isolado so aparece nesses dois JCW (os a combustao usam 1.6/2.0/Turbo).
  { brand: "Mini", model: "John Works E", discount: 0.30 }, // 30%

  // Jeep
  // Confirmado ao vivo na FIPE (marca "Jeep", código 29): todos os trims de
  // Compass começam com "COMPASS " (ex: "COMPASS LIMITED...", "COMPASS
  // SPORT...", "COMPASS S 1.3 TB 4XE Aut. (Híbrido)"), então um único token
  // "compass" cobre todas as versões, sem exceção pedida pelo usuário.
  { brand: "Jeep", model: "Compass", discount: 0.25 }, // 25%

  // Yamaha (motos)
  // Confirmado ao vivo na FIPE (marca "YAMAHA", código 101): a linha R1 tem
  // duas versões com nomes de modelo distintos — "YZF R-1 1000" (código 3109)
  // e "YZF R-1M 1000", a variante M (código 7681). Precisam de duas entradas
  // porque os tokens "1" e "1m" são palavras diferentes no match; sem a
  // segunda entrada a R-1M cairia no desconto padrão (20%) por engano.
  { brand: "Yamaha", model: "Yzf R-1 1000", discount: 0.3 }, // 30%
  { brand: "Yamaha", model: "Yzf R-1m 1000", discount: 0.3 }, // 30%

  // Ducati (motos)
  // FIPE (marca "DUCATI", codigo 74) grafa "1299 Panigale" e "1299 Panigale S".
  // Os tokens "1299" + "panigale" pegam as duas versoes e NAO colidem com
  // "1199 Panigale", "959 Panigale" nem "Panigale V4" (nenhum tem "1299").
  { brand: "Ducati", model: "1299 Panigale", discount: 0.35 }, // 35%
];

// ---- Matching tolerante a variações de grafia ----

// Regex criada uma vez só. Antes era instanciada a cada chamada de normalize()
// — e normalize() roda milhares de vezes por busca, então isso pesava.
const COMBINING_MARKS = new RegExp('[̀-ͯ]', 'g');

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokens de um nome de modelo, para o match parcial por palavra completa.
// Mantém tokens de 1 letra (ver comentário em lookupDiscount) — importante
// para o script de verificação (scripts/verify-discount-table.ts) reusar a
// mesma regra que o app usa em tempo de execução.
export function tableWordsOf(model: string): string[] {
  return normalize(model).split(' ').filter(w => w.length >= 1);
}

// Chave: grafia normalizada da FIPE. Valor: grafia normalizada da planilha.
const BRAND_ALIASES: Record<string, string> = {
  'mercedes benz':    'mercedezbenz',   // FIPE usa "Mercedes-Benz"
  'mercedez benz':    'mercedezbenz',   // planilha usa "Mercedez-Benz" (typo)
  'mercedes':         'mercedezbenz',
  'volkswagen':       'volkswagen',
  'vw':               'volkswagen',
  'vw volkswagen':    'volkswagen',     // fallback caso o corte por " - " não rode
  'mitsubishi':       'mitsubish',
  'byd':              'byd',
  'chery':            'caoa chery',
  'caoa chery':       'caoa chery',
  'caoa chery chery': 'caoa chery',     // FIPE tem um 2º código de marca "Caoa Chery/Chery"
  'gm chevrolet':     'chevrolet',      // fallback caso o corte por " - " não rode
  'chevrolet':        'chevrolet',
};

// Normaliza marca, aplicando alias se houver.
//
// A FIPE às vezes usa o padrão "SIGLA - Nome Completo" pro campo de marca
// (confirmado ao vivo na API: "VW - VolksWagen", "GM - Chevrolet"). Sem tratar
// isso, a marca nunca batia com a tabela e TODO carro dessas marcas caía no
// desconto padrão (20%) — bug real, não só teórico. Por isso, quando o texto
// tem " - ", usamos só a parte depois do traço (o nome de verdade da marca)
// antes de aplicar os aliases de sempre. As entradas 'vw volkswagen' e
// 'gm chevrolet' no dicionário acima são um fallback extra pro caso de a
// FIPE mandar o texto colado (sem espaços ao redor do traço) algum dia.
//
// "Mercedez-Benz" na planilha normaliza para "mercedezbenz" (sem espaço, typo com z).
// "MERCEDES-BENZ" da FIPE normaliza para "mercedes benz" → alias → "mercedezbenz". Match!
export function normBrand(raw: string): string {
  const afterPrefix = raw.includes(' - ') ? raw.split(' - ').pop()! : raw;
  const n = normalize(afterPrefix.replace(/-/g, ''));  // remove hífens antes de normalizar
  return BRAND_ALIASES[normalize(afterPrefix)] ?? BRAND_ALIASES[n] ?? normalize(afterPrefix);
}

export interface DiscountLookupResult {
  discount: number;
  discountPercent: number;
  source: 'table' | 'default';
  matchedBrand?: string;
  matchedModel?: string;
  kmPerYear?: number; // média de km/ano do modelo (undefined = usar padrão)
}

/**
 * Busca o desconto para marca + modelo.
 * 1. Match exato (marca + modelo normalizados)
 * 2. Match parcial por palavras completas (evita "M5" casar com "X5 M50i")
 * 3. Fallback: DEFAULT_DISCOUNT_PERCENT
 */
// ---- Índice pré-calculado + cache (performance) ----
//
// Antes, cada busca normalizava marca e modelo de TODAS as ~380 entradas da
// tabela, duas vezes (match exato + parcial). Como lookupDiscount roda a cada
// tecla digitada no campo de km (via preview), isso custava ~1ms por tecla no
// desktop e bem mais em celular modesto.
//
// Agora a normalização de cada entrada é feita UMA vez (lazy, no primeiro uso)
// e o resultado de cada par marca+modelo fica em cache. O comportamento do
// match é exatamente o mesmo — só deixou de refazer trabalho repetido.
interface IndexedEntry {
  entry: DiscountEntry;
  nb: string;      // marca normalizada
  nm: string;      // modelo normalizado
  words: string[]; // tokens do modelo
}

let _index: IndexedEntry[] | null = null;

// Lazy: BRAND_ALIASES/normBrand são declarados depois da tabela, então o
// índice não pode ser montado no topo do módulo.
function getIndex(): IndexedEntry[] {
  if (!_index) {
    _index = DISCOUNT_TABLE.map((entry) => ({
      entry,
      nb: normBrand(entry.brand),
      nm: normalize(entry.model),
      words: tableWordsOf(entry.model),
    }));
  }
  return _index;
}

const _lookupCache = new Map<string, DiscountLookupResult>();

// Desconto por MARCA inteira (fallback): usado quando nenhum modelo especifico
// casa. Vale para todos os modelos da marca, inclusive futuros. A chave e a
// marca normalizada (ver normBrand). Se um modelo especifico da marca precisar
// de outro valor, basta uma entrada em DISCOUNT_TABLE, que tem prioridade.
const BRAND_DEFAULTS: Record<string, number> = {
  lexus: 0.30, // todos os modelos Lexus -> 30%
};

export function lookupDiscount(brand: string, model: string): DiscountLookupResult {
  const cacheKey = `${brand}|${model}`;
  const cached = _lookupCache.get(cacheKey);
  if (cached) return cached;

  const result = computeDiscount(brand, model);
  _lookupCache.set(cacheKey, result);
  return result;
}

function computeDiscount(brand: string, model: string): DiscountLookupResult {
  const index = getIndex();
  const nb = normBrand(brand);
  const nm = normalize(model);

  // 1. Match exato
  const exact = index.find((e) => e.nb === nb && e.nm === nm)?.entry;
  if (exact) {
    return { discount: exact.discount, discountPercent: Math.round(exact.discount * 100), source: 'table', matchedBrand: exact.brand, matchedModel: exact.model, kmPerYear: exact.kmPerYear };
  }

  // 2. Match parcial por palavra: divide em tokens e verifica se todos os
  //    tokens do modelo da tabela aparecem como palavras completas no modelo da FIPE.
  //    Ex: tabela "911 Carrera" → tokens ["911", "carrera"] → todos em "911 carrera 4s" → match
  //    Mas "M5" → token ["m5"] → "x5 m50i".split(" ") = ["x5","m50i"] → "m5" não está → no match ✓
  //
  //    Quando mais de uma linha da tabela "cabe" no modelo da FIPE (ex: "Range Rover"
  //    E "Range Rover Sport" cabem em "Range Rover Sport HSE"), fica com a que tem
  //    mais palavras — a mais específica — em vez da primeira encontrada na lista.
  //
  //    Importante: mantemos até tokens de 1 letra. A Mercedez-Benz usa letra de
  //    classe + número ("A 200", "C 200", "S 560"...) — se descartássemos a letra,
  //    "A 200" e "C 200" virariam o mesmo token ["200"] e a primeira da lista
  //    venceria mesmo para um "C 200" (bug real, achado ao testar essa correção).
  // Set em vez de array: a checagem de cada token vira O(1).
  const nmWords = new Set(nm.split(' '));
  const candidates = index.filter(
    (e) => e.nb === nb && e.words.length > 0 && e.words.every((w) => nmWords.has(w))
  );
  const partialIdx = candidates.length > 0
    ? candidates.reduce((best, cur) => (cur.words.length > best.words.length ? cur : best))
    : undefined;
  const partial = partialIdx?.entry;
  if (partial) {
    return { discount: partial.discount, discountPercent: Math.round(partial.discount * 100), source: 'table', matchedBrand: partial.brand, matchedModel: partial.model, kmPerYear: partial.kmPerYear };
  }

  // 3. Fallback por marca: nenhum modelo casou, mas a marca inteira tem um
  //    desconto definido (ex: Lexus -> 30%). Vale inclusive para modelos novos.
  const brandDefault = BRAND_DEFAULTS[nb];
  if (brandDefault !== undefined) {
    return { discount: brandDefault, discountPercent: Math.round(brandDefault * 100), source: 'table', matchedBrand: brand, matchedModel: brand };
  }

  return {
    discount: DEFAULT_DISCOUNT_PERCENT / 100,
    discountPercent: DEFAULT_DISCOUNT_PERCENT,
    source: 'default',
  };
}
