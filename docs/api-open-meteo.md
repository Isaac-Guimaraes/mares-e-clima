# Endpoints do Open-Meteo usados no projeto

Documentação oficial consultada em 18/10/2026. Todas as APIs: GET, resposta JSON, sem chave para uso não comercial. Erros de parâmetro retornam HTTP 400 com `{ "error": true, "reason": "..." }`.

## 1. Geocoding API — buscar a praia

`https://geocoding-api.open-meteo.com/v1/search` · [documentação](https://open-meteo.com/en/docs/geocoding-api)

| Parâmetro | Uso no projeto |
| --- | --- |
| `name` | Nome digitado pelo usuário |
| `count` | 40 candidatos; a Marine API descarta os que não têm maré (nível do mar nulo) e são exibidos até 8 |
| `language` | `pt` |
| `countryCode` | `BR` (configurável em `PAIS_PADRAO`) |

Campos aproveitados: `id`, `name`, `latitude`, `longitude`, `timezone`, `country`, `admin1` (estado), `admin2` (município).

Comportamento observado: com 2 letras a API só aceita nome exato. A base registra "Ipanema", não "Praia de Ipanema", por isso o serviço repete a busca sem o prefixo quando não encontra nada.

```
https://geocoding-api.open-meteo.com/v1/search?name=Itapu%C3%A3&count=8&language=pt&format=json&countryCode=BR
```

## 2. Marine Weather API — maré, ondas e água

`https://marine-api.open-meteo.com/v1/marine` · [documentação](https://open-meteo.com/en/docs/marine-weather-api)

| Variável (`hourly`) | Unidade | Uso |
| --- | --- | --- |
| `sea_level_height_msl` | m | Curva de maré; máximos e mínimos locais = maré alta e baixa |
| `wave_height` | m | Altura das ondas |
| `wave_direction` | ° | De onde vêm as ondas |
| `wave_period` | s | Intervalo entre ondas |
| `sea_surface_temperature` | °C | Temperatura da água |

Outros parâmetros: `timezone`, `forecast_days` (até 8), `cell_selection=sea`.

Limitações: maré e correntes calculadas a ~8 km de resolução; precisão limitada na costa; referência é o nível médio global do mar (não o zero hidrográfico das tábuas). Não serve para navegação.

```
https://marine-api.open-meteo.com/v1/marine?latitude=-12.95&longitude=-38.36&hourly=sea_level_height_msl,wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=America/Bahia&forecast_days=3&cell_selection=sea
```

## 3. Weather Forecast API — tempo

`https://api.open-meteo.com/v1/forecast` · [documentação](https://open-meteo.com/en/docs)

| Variável | Tipo | Unidade | Uso |
| --- | --- | --- | --- |
| `temperature_2m` | hourly | °C | Temperatura do ar |
| `apparent_temperature` | hourly | °C | Sensação térmica |
| `precipitation_probability` | hourly | % | Critério de recomendação |
| `precipitation` | hourly | mm | Volume de chuva |
| `weather_code` | hourly e daily | WMO | Descrição traduzida em `utils/weather-codes.ts` |
| `wind_speed_10m` | hourly | km/h | Critério de recomendação |
| `wind_direction_10m` | hourly | ° | Direção do vento |
| `uv_index` | hourly | índice | Exposição solar |
| `temperature_2m_max`, `temperature_2m_min` | daily | °C | Resumo diário |
| `uv_index_max` | daily | índice | Resumo diário |
| `sunrise`, `sunset` | daily | ISO 8601 | Define o período diurno |

Com variáveis `daily`, o parâmetro `timezone` é obrigatório.

```
https://api.open-meteo.com/v1/forecast?latitude=-12.95&longitude=-38.36&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=America/Bahia&forecast_days=3
```

## Integração

As chamadas Marine e Forecast usam o mesmo `timezone` e `forecast_days`, então os vetores `hourly.time` coincidem. O `CondicoesService` une as séries pelo horário e o cache guarda as respostas por 60 minutos.
