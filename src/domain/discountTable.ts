// Tabela de descontos por marca e modelo.
// Gerada automaticamente da planilha Tabela_Fipe_-_Tabela_desconto_para_compra.xlsx
//
// Para adicionar novos modelos: insira uma nova linha em DISCOUNT_TABLE no formato
//   { brand: "Marca", model: "Modelo", discount: 0.XX }, // XX%
//
// Modelos não listados usam DEFAULT_DISCOUNT_PERCENT (-20%).

export interface DiscountEntry {
  brand: string;
  model: string;
  discount: number; // ex: 0.20 = 20% de desconto sobre o valor FIPE
}

export const DEFAULT_DISCOUNT_PERCENT = 20;

// ---- Tabela principal — edite aqui para adicionar ou ajustar modelos ----
export const DISCOUNT_TABLE: DiscountEntry[] = [
  // BMW
  { brand: "BMW", model: "118i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "120i", discount: 0.15 }, // 15%
  { brand: "BMW", model: "218i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "220i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "320i", discount: 0.15 }, // 15%
  { brand: "BMW", model: "328i", discount: 0.15 }, // 15%
  { brand: "BMW", model: "330e", discount: 0.18 }, // 18%
  { brand: "BMW", model: "330i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "420i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "430i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "530e", discount: 0.25 }, // 25%
  { brand: "BMW", model: "530i", discount: 0.23 }, // 23%
  { brand: "BMW", model: "540i", discount: 0.23 }, // 23%
  { brand: "BMW", model: "730li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "745le", discount: 0.3 }, // 30%
  { brand: "BMW", model: "750li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "750i", discount: 0.3 }, // 30%
  { brand: "BMW", model: "I4", discount: 0.3 }, // 30%
  { brand: "BMW", model: "M 135i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M 140i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M 235i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M 240i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M 340i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M 440i", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M 760li", discount: 0.3 }, // 30%
  { brand: "BMW", model: "M 850i", discount: 0.35 }, // 35%
  { brand: "BMW", model: "M2", discount: 0.2 }, // 20%
  { brand: "BMW", model: "M3", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M4", discount: 0.18 }, // 18%
  { brand: "BMW", model: "M5", discount: 0.15 }, // 15%
  { brand: "BMW", model: "M6", discount: 0.35 }, // 35%
  { brand: "BMW", model: "M8", discount: 0.35 }, // 35%
  { brand: "BMW", model: "X1", discount: 0.18 }, // 18%
  { brand: "BMW", model: "X2", discount: 0.2 }, // 20%
  { brand: "BMW", model: "X3", discount: 0.18 }, // 18%
  { brand: "BMW", model: "X4", discount: 0.18 }, // 18%
  { brand: "BMW", model: "X5", discount: 0.2 }, // 20%
  { brand: "BMW", model: "X6", discount: 0.18 }, // 18%
  { brand: "BMW", model: "X7", discount: 0.3 }, // 30%
  { brand: "BMW", model: "Z4", discount: 0.18 }, // 18%
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
  { brand: "Land Rover", model: "Discovery", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Discovery Sport", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Range Rover", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Range Rover Evoque", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Evoque", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "EVO", discount: 0.25 }, // 25%
  { brand: "Land Rover", model: "Range Rover Sport", discount: 0.3 }, // 30%
  { brand: "Land Rover", model: "Range Rover Velar", discount: 0.3 }, // 30%
  { brand: "Land Rover", model: "Range Rover Vogue", discount: 0.3 }, // 30%

  // Audi
  { brand: "Audi", model: "A1", discount: 0.2 }, // 20%
  { brand: "Audi", model: "A3", discount: 0.2 }, // 20%
  { brand: "Audi", model: "A4", discount: 0.25 }, // 25%
  { brand: "Audi", model: "A5", discount: 0.25 }, // 25%
  { brand: "Audi", model: "A6", discount: 0.3 }, // 30%
  { brand: "Audi", model: "A6 E-tron", discount: 0.35 }, // 35%
  { brand: "Audi", model: "A7", discount: 0.35 }, // 35%
  { brand: "Audi", model: "A8", discount: 0.35 }, // 35%
  { brand: "Audi", model: "E-tron", discount: 0.35 }, // 35%
  { brand: "Audi", model: "E-tron Gt", discount: 0.35 }, // 35%
  { brand: "Audi", model: "Q3", discount: 0.2 }, // 20%
  { brand: "Audi", model: "Q5", discount: 0.2 }, // 20%
  { brand: "Audi", model: "Q6 E-tron", discount: 0.35 }, // 35%
  { brand: "Audi", model: "Q7", discount: 0.3 }, // 30%
  { brand: "Audi", model: "Q8", discount: 0.3 }, // 30%
  { brand: "Audi", model: "Q8 E-tron", discount: 0.35 }, // 35%
  { brand: "Audi", model: "R8", discount: 0.3 }, // 30%
  { brand: "Audi", model: "Rs E-tron Gt", discount: 0.34 }, // 34%
  { brand: "Audi", model: "Rs Q3", discount: 0.35 }, // 35%
  { brand: "Audi", model: "Rs Q8", discount: 0.35 }, // 35%
  { brand: "Audi", model: "Rs3", discount: 0.3 }, // 30%
  { brand: "Audi", model: "Rs4", discount: 0.3 }, // 30%
  { brand: "Audi", model: "Rs5", discount: 0.3 }, // 30%
  { brand: "Audi", model: "Rs6", discount: 0.33 }, // 33%
  { brand: "Audi", model: "Rs7", discount: 0.33 }, // 33%
  { brand: "Audi", model: "Sq5", discount: 0.33 }, // 33%
  { brand: "Audi", model: "Sq6 E-tron", discount: 0.35 }, // 35%
  { brand: "Audi", model: "Sq8 E-tron", discount: 0.35 }, // 35%
  { brand: "Audi", model: "Tt", discount: 0.25 }, // 25%
  { brand: "Audi", model: "Tt Rs", discount: 0.25 }, // 25%
  { brand: "Audi", model: "Tts", discount: 0.25 }, // 25%

  // Mercedez-Benz
  { brand: "Mercedez-Benz", model: "A 200", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "A 250", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "A 35 Amg", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "A 45 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "Amg Gt", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Amg Gt 43", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "Amg Gt 63", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "B 200", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "C 180", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "C 200", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "C 250", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "C 300", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "C 43 Amg", discount: 0.22 }, // 22%
  { brand: "Mercedez-Benz", model: "C 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Cla 180", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "Cla 200", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "Cla 250", discount: 0.2 }, // 20%
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
  { brand: "Mercedez-Benz", model: "G 63 Amg", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "Gla 200", discount: 0.2 }, // 20%
  { brand: "Mercedez-Benz", model: "Gla 250", discount: 0.2 }, // 20%
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
  { brand: "Mercedez-Benz", model: "Gle 350", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gle 400", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gle 400d", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gle 43 Amg", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gle 450d", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gle 53 Amg", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gle 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Gls 350", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gls 450", discount: 0.28 }, // 28%
  { brand: "Mercedez-Benz", model: "Gls 600", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Gls 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Metris", discount: 0.25 }, // 25%
  { brand: "Mercedez-Benz", model: "S 560", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 580", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 63 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 65 Amg", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "S 680", discount: 0.35 }, // 35%
  { brand: "Mercedez-Benz", model: "Sl 400", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Sl 63 Amg", discount: 0.35 }, // 35%
  { brand: "Mercedez-Benz", model: "Slc 300", discount: 0.3 }, // 30%
  { brand: "Mercedez-Benz", model: "Slc 43 Amg", discount: 0.35 }, // 35%

  // Volvo
  { brand: "Volvo", model: "C40", discount: 0.2 }, // 20%
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

  // Toyota
  { brand: "Toyota", model: "Camry", discount: 0.3 }, // 30%
  { brand: "Toyota", model: "Corolla", discount: 0.16 }, // 16%
  { brand: "Toyota", model: "Corolla Cross", discount: 0.16 }, // 16%
  { brand: "Toyota", model: "Etios", discount: 0.15 }, // 15%
  { brand: "Toyota", model: "Etios Cross", discount: 0.15 }, // 15%
  { brand: "Toyota", model: "Gr Corolla", discount: 0.18 }, // 18%
  { brand: "Toyota", model: "Gr Yaris", discount: 0.18 }, // 18%
  { brand: "Toyota", model: "Hiace", discount: 0.18 }, // 18%
  { brand: "Toyota", model: "Hilux", discount: 0.18 }, // 18%
  { brand: "Toyota", model: "Hilux Sw4", discount: 0.18 }, // 18%
  { brand: "Toyota", model: "Prius", discount: 0.2 }, // 20%
  { brand: "Toyota", model: "Rav4", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Sienna", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Supra", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Tundra", discount: 0.22 }, // 22%
  { brand: "Toyota", model: "Yaris", discount: 0.18 }, // 18%
  { brand: "Toyota", model: "Yaris Cross", discount: 0.18 }, // 18%

  // Honda
  { brand: "Honda", model: "Accord", discount: 0.3 }, // 30%
  { brand: "Honda", model: "City", discount: 0.15 }, // 15%
  { brand: "Honda", model: "Civic", discount: 0.15 }, // 15%
  // CR-V: só a versão Híbrida tem 25%. Confirmado ao vivo na FIPE que hoje
  // só existe UMA versão "(Híbrido)" ("CR-V Touring 2.0 16V AWD Aut.(Híbrido)");
  // as demais versões (2.0/2.4 a combustão) caem no padrão de 20%.
  { brand: "Honda", model: "Cr-v Hibrido", discount: 0.25 }, // 25%
  { brand: "Honda", model: "Fit", discount: 0.15 }, // 15%
  { brand: "Honda", model: "Hr-v", discount: 0.18 }, // 18%
  { brand: "Honda", model: "Wr-v", discount: 0.15 }, // 15%
  { brand: "Honda", model: "Zr-v", discount: 0.22 }, // 22%

  // Fiat
  { brand: "Fiat", model: "500", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "500e", discount: 0.3 }, // 30%
  { brand: "Fiat", model: "Argo", discount: 0.2 }, // 20%
  { brand: "Fiat", model: "Cronos", discount: 0.2 }, // 20%
  { brand: "Fiat", model: "Doblò", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Ducato", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Fastback", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Fiorino", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Grand Siena", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Mobi", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Palio", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Pulse", discount: 0.19 }, // 19%
  { brand: "Fiat", model: "Punto", discount: 0.19 }, // 19%
  { brand: "Fiat", model: "Scudo", discount: 0.2 }, // 20%
  { brand: "Fiat", model: "Strada", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Titano", discount: 0.25 }, // 25%
  { brand: "Fiat", model: "Topolino", discount: 0.25 }, // 25%
  { brand: "Fiat", model: "Toro", discount: 0.18 }, // 18%
  { brand: "Fiat", model: "Uno", discount: 0.18 }, // 18%

  // Chevrolet
  { brand: "Chevrolet", model: "Blazer Ev", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Bolt", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Bolt Euv", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Camaro", discount: 0.2 }, // 20%
  { brand: "Chevrolet", model: "Captiva", discount: 0.2 }, // 20%
  { brand: "Chevrolet", model: "Captiva Ev", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Cobalt", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Corvette", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Cruze", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Equinox", discount: 0.2 }, // 20%
  { brand: "Chevrolet", model: "Equinox Ev", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Joy", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Montana", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Onix", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Prisma", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "S10", discount: 0.18 }, // 18%
  { brand: "Chevrolet", model: "Silverado", discount: 0.25 }, // 25%
  { brand: "Chevrolet", model: "Spark Euv", discount: 0.25 }, // 25%
  { brand: "Chevrolet", model: "Spin", discount: 0.2 }, // 20%
  { brand: "Chevrolet", model: "Suburban", discount: 0.3 }, // 30%
  { brand: "Chevrolet", model: "Tracker", discount: 0.2 }, // 20%
  { brand: "Chevrolet", model: "Trailblazer", discount: 0.25 }, // 25%

  // Volkswagen
  { brand: "Volkswagen", model: "Amarok", discount: 0.25 }, // 25% — todas as versões/trims
  { brand: "Volkswagen", model: "Crossfox", discount: 0.2 }, // 20%
  { brand: "Volkswagen", model: "Delivery Express", discount: 0.2 }, // 20%
  { brand: "Volkswagen", model: "Fox", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Gol", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Golf", discount: 0.2 }, // 20%
  { brand: "Volkswagen", model: "Id.buzz", discount: 0.25 }, // 25%
  { brand: "Volkswagen", model: "Jetta", discount: 0.2 }, // 20%
  { brand: "Volkswagen", model: "Nivus", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Passat", discount: 0.3 }, // 30%
  { brand: "Volkswagen", model: "Polo", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Saveiro", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Spacefox", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "T-cross", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Taos", discount: 0.19 }, // 19%
  { brand: "Volkswagen", model: "Tera", discount: 0.19 }, // 19%
  { brand: "Volkswagen", model: "Tiguan", discount: 0.19 }, // 19%
  { brand: "Volkswagen", model: "Touareg", discount: 0.35 }, // 35%
  { brand: "Volkswagen", model: "Up", discount: 0.18 }, // 18%
  { brand: "Volkswagen", model: "Virtus", discount: 0.19 }, // 19%
  { brand: "Volkswagen", model: "Voyage", discount: 0.18 }, // 18%

  // Mitsubish
  { brand: "Mitsubish", model: "Asx", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "Eclipse Cross", discount: 0.18 }, // 18%
  { brand: "Mitsubish", model: "L200 Outdoor", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "L200 Savana", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "L200 Triton", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "Lancer", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "Outlander", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "Outlander Sport", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "Pajero", discount: 0.18 }, // 18%
  { brand: "Mitsubish", model: "Pajero Dakar", discount: 0.18 }, // 18%
  { brand: "Mitsubish", model: "Pajero Full", discount: 0.2 }, // 20%
  { brand: "Mitsubish", model: "Pajero Sport", discount: 0.19 }, // 19%
  { brand: "Mitsubish", model: "Triton", discount: 0.18 }, // 18%

  // Porsche
  { brand: "Porsche", model: "718", discount: 0.25 }, // 25%
  { brand: "Porsche", model: "911", discount: 0.25 }, // 25%
  { brand: "Porsche", model: "Cayenne", discount: 0.3 }, // 30%
  { brand: "Porsche", model: "Macan", discount: 0.2 }, // 20%
  { brand: "Porsche", model: "Panamera", discount: 0.25 }, // 25%
  { brand: "Porsche", model: "Taycan", discount: 0.3 }, // 30%

  // BYD
  { brand: "BYD", model: "Dolphin", discount: 0.2 }, // 20%
  { brand: "BYD", model: "Dolphin Mini", discount: 0.15 }, // 15%
  { brand: "BYD", model: "Han", discount: 0.3 }, // 30%
  { brand: "BYD", model: "King", discount: 0.2 }, // 20%
  { brand: "BYD", model: "Seal", discount: 0.28 }, // 28%
  { brand: "BYD", model: "Shark", discount: 0.28 }, // 28%
  { brand: "BYD", model: "Song Plus", discount: 0.2 }, // 20%
  { brand: "BYD", model: "Song Plus Premium", discount: 0.2 }, // 20%
  { brand: "BYD", model: "Song Pro", discount: 0.2 }, // 20%
  { brand: "BYD", model: "Tan", discount: 0.3 }, // 30%
  { brand: "BYD", model: "Yuan Plus", discount: 0.25 }, // 25%
  { brand: "BYD", model: "Yuan Pro", discount: 0.25 }, // 25%

  // Ford
  { brand: "Ford", model: "Bronco Sport", discount: 0.22 }, // 22%
  { brand: "Ford", model: "E-transit", discount: 0.18 }, // 18%
  { brand: "Ford", model: "Ecosport", discount: 0.18 }, // 18%
  { brand: "Ford", model: "Edge", discount: 0.25 }, // 25%
  { brand: "Ford", model: "Escape", discount: 0.25 }, // 25%
  { brand: "Ford", model: "F-150", discount: 0.2 }, // 20%
  { brand: "Ford", model: "F-250", discount: 0.2 }, // 20%
  { brand: "Ford", model: "F-350", discount: 0.2 }, // 20%
  { brand: "Ford", model: "F-4000", discount: 0.2 }, // 20%
  { brand: "Ford", model: "F-450", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Fiesta", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Focus", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Fusion", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Gt", discount: 0.25 }, // 25%
  { brand: "Ford", model: "Ka", discount: 0.18 }, // 18%
  { brand: "Ford", model: "Ka +", discount: 0.19 }, // 19%
  { brand: "Ford", model: "Maverick", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Mustang", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Mustang Mach-e", discount: 0.35 }, // 35%
  { brand: "Ford", model: "Ranger", discount: 0.2 }, // 20%
  { brand: "Ford", model: "Territory", discount: 0.22 }, // 22%
  { brand: "Ford", model: "Transit", discount: 0.2 }, // 20%

  // Nissan
  { brand: "Nissan", model: "Frontier", discount: 0.25 }, // 25%
  { brand: "Nissan", model: "Kait", discount: 0.2 }, // 20%
  { brand: "Nissan", model: "Kicks", discount: 0.18 }, // 18%
  { brand: "Nissan", model: "Kicks Play", discount: 0.18 }, // 18%
  { brand: "Nissan", model: "Leaf", discount: 0.3 }, // 30%
  { brand: "Nissan", model: "March", discount: 0.18 }, // 18%
  { brand: "Nissan", model: "Sentra", discount: 0.19 }, // 19%
  { brand: "Nissan", model: "Versa", discount: 0.15 }, // 15%
  { brand: "Nissan", model: "Z", discount: 0.3 }, // 30%

  // Caoa Chery
  { brand: "Caoa Chery", model: "Arrizo 5", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Arrizo 6", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Arrizo 6 Pro", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Qq", discount: 0.25 }, // 25%
  { brand: "Caoa Chery", model: "Tiggo 2", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 3x", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 5x Pro", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 5x", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 7", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 7 Pro", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 8", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Tiggo 8 Pro", discount: 0.2 }, // 20%
  { brand: "Caoa Chery", model: "Icar", discount: 0.25 }, // 25%

  // Hyundai
  { brand: "Hyundai", model: "Azera", discount: 0.25 }, // 25%
  { brand: "Hyundai", model: "Creta", discount: 0.18 }, // 18%
  { brand: "Hyundai", model: "Elantra", discount: 0.2 }, // 20%
  { brand: "Hyundai", model: "Hb20", discount: 0.18 }, // 18%
  { brand: "Hyundai", model: "Hb20s", discount: 0.18 }, // 18%
  { brand: "Hyundai", model: "Hb20x", discount: 0.18 }, // 18%
  { brand: "Hyundai", model: "Hr", discount: 0.18 }, // 18%
  { brand: "Hyundai", model: "Ioniq", discount: 0.25 }, // 25%
  { brand: "Hyundai", model: "Ioniq 5", discount: 0.28 }, // 28%
  { brand: "Hyundai", model: "Ix35", discount: 0.2 }, // 20%
  { brand: "Hyundai", model: "Kona", discount: 0.2 }, // 20%
  { brand: "Hyundai", model: "Palisade", discount: 0.28 }, // 28%
  { brand: "Hyundai", model: "Santa Fé", discount: 0.25 }, // 25%
  { brand: "Hyundai", model: "Tucson", discount: 0.2 }, // 20%

  // GWM
  { brand: "GWM", model: "Haval H6", discount: 0.2 }, // 20%
  { brand: "GWM", model: "Haval H6 Gt", discount: 0.2 }, // 20%
  { brand: "GWM", model: "Haval H9", discount: 0.2 }, // 20%
  { brand: "GWM", model: "Ora 03", discount: 0.18 }, // 18%
  { brand: "GWM", model: "Poer P30", discount: 0.2 }, // 20%
  { brand: "GWM", model: "Tank 300", discount: 0.2 }, // 20%
  { brand: "GWM", model: "Wey 07", discount: 0.25 }, // 25%
];

// ---- Matching tolerante a variações de grafia ----

export function normalize(s: string): string {
  const combiningMarksPattern = new RegExp('[̀-ͯ]', 'g');
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(combiningMarksPattern, '')
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
}

/**
 * Busca o desconto para marca + modelo.
 * 1. Match exato (marca + modelo normalizados)
 * 2. Match parcial por palavras completas (evita "M5" casar com "X5 M50i")
 * 3. Fallback: DEFAULT_DISCOUNT_PERCENT
 */
export function lookupDiscount(brand: string, model: string): DiscountLookupResult {
  const nb = normBrand(brand);
  const nm = normalize(model);

  // 1. Match exato
  const exact = DISCOUNT_TABLE.find(
    (e) => normBrand(e.brand) === nb && normalize(e.model) === nm
  );
  if (exact) {
    return { discount: exact.discount, discountPercent: Math.round(exact.discount * 100), source: 'table', matchedBrand: exact.brand, matchedModel: exact.model };
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
  const nmWords = nm.split(' ');
  const candidates = DISCOUNT_TABLE.filter((e) => {
    if (normBrand(e.brand) !== nb) return false;
    const tableWords = tableWordsOf(e.model);
    return tableWords.length > 0 && tableWords.every(w => nmWords.includes(w));
  });
  const partial = candidates.length > 0
    ? candidates.reduce((best, cur) =>
        tableWordsOf(cur.model).length > tableWordsOf(best.model).length ? cur : best
      )
    : undefined;
  if (partial) {
    return { discount: partial.discount, discountPercent: Math.round(partial.discount * 100), source: 'table', matchedBrand: partial.brand, matchedModel: partial.model };
  }

  return {
    discount: DEFAULT_DISCOUNT_PERCENT / 100,
    discountPercent: DEFAULT_DISCOUNT_PERCENT,
    source: 'default',
  };
}
