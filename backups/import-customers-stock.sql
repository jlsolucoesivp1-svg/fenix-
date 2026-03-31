BEGIN;
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755109247494', '{"id":"CUST-1755109247494","name":"ADVOCACIA Doutor Gilmar","phone":"43 99746419","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752520699538-0.03593661342012322', '{"id":"1752520699538-0.03593661342012322","name":"ADVOCACIA JOÃO FABIO HILARIO (fILHO)","phone":"43996375274","email":"TESTE@TESTE.COM","address":"RUA MARECHAL FLORIANO PEIXOTO, 80","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755019361820', '{"id":"CUST-1755019361820","name":"ADVOCACIA JOÃO RENATO BITENCOURT","phone":"43999124644","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753379075810-0.14090593043058108', '{"id":"1753379075810-0.14090593043058108","name":"ADVOCACIA LINCON","phone":"43991398905","email":"TESTE@TESTE.COM","address":"AVENIDA CASTELO BRANCO ","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753472685180-0.1180730707559845', '{"id":"1753472685180-0.1180730707559845","name":"AMPLA ARTEFATOS","phone":"43996984541","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755546260912', '{"id":"CUST-1755546260912","name":"APAC","phone":"(99)999999999","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752525160400-0.21769594684339721', '{"id":"1752525160400-0.21769594684339721","name":"ARMAZEM NATUREBA","phone":"43999769063","email":"TESTE@TESTE.COM","address":"AVENIDA BRASIL","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754747446003-0.7680073229090186', '{"id":"1754747446003-0.7680073229090186","name":"AROLDO (TOPOGEO)","phone":"43999225256","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1756142520440', '{"id":"CUST-1756142520440","name":"Advocacia Júlio César da Costa","phone":"43 999814235","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754069521071-0.5251903866898372', '{"id":"1754069521071-0.5251903866898372","name":"Advocacia Makita","phone":"43996049078","email":"TESTE@TESTE.COM","address":"RUA MARECHAL FLORIANO PEIXOTO, 80","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1757944403385', '{"id":"CUST-1757944403385","name":"BOTTINI CALÇADOS ","phone":"43999771592","email":"","address":"AVENIDA PARANÁ","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752524196787-0.21135363759111103', '{"id":"1752524196787-0.21135363759111103","name":"CESTA BASICA SANTA RITA","phone":"43988633294","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752779276427-0.007760477428592205', '{"id":"1752779276427-0.007760477428592205","name":"CIAMÁQUINAS OFFCE","phone":"43999341490","email":"TESTE@TESTE.COM","address":"AVENIDA PRANÁ","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752581309250-0.23832530068551883', '{"id":"1752581309250-0.23832530068551883","name":"CINE FOTO REGINA ","phone":"4334721917","email":"TESTES@TESTE.COM","address":"AVENIDA SOUZA NAVES 945","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752591100370-0.5475282037034886', '{"id":"1752591100370-0.5475282037034886","name":"CLIENTE AVULSO","phone":"43996024065","email":"jl.solucoes@hotmail.com","address":"RUA MARECHAL FLORIANO PEIXOTO, 80","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755517753824', '{"id":"CUST-1755517753824","name":"CLINICA HARMONIA ","phone":"43996293086","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753461605858-0.8713826447317187', '{"id":"1753461605858-0.8713826447317187","name":"CMEI ODETE BRASIL ","phone":"43996699824","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755019786907', '{"id":"CUST-1755019786907","name":"CMEI PAULO FREIRE ","phone":"430998502130","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753462813417-0.37245804640151114', '{"id":"1753462813417-0.37245804640151114","name":"COLÉGIO OBJETIVO","phone":"4334726454","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754586479771-0.3507579603855565', '{"id":"1754586479771-0.3507579603855565","name":"CONCREVALI","phone":"4334751922","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754070290274-0.6204661443723137', '{"id":"1754070290274-0.6204661443723137","name":"Carlos Ramos ","phone":"434399761553","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754675763740-0.04156320956781723', '{"id":"1754675763740-0.04156320956781723","name":"Creusa Pereira Teixeira","phone":"43 88369460","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754747233450-0.6686105561895997', '{"id":"1754747233450-0.6686105561895997","name":"DIOU CARLOS ","phone":"4343999774776","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1754999911249', '{"id":"CUST-1754999911249","name":"DIOU CARLOS ","phone":"4399774776","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753459989367-0.6203326522979118', '{"id":"1753459989367-0.6203326522979118","name":"DR. LINCON ","phone":"43991398905","email":"TESTE@TESTE.COM","address":"AV CASTELO BRANCO","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753283722550-0.9771248242925842', '{"id":"1753283722550-0.9771248242925842","name":"Dra Leila ","phone":"43998157388","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752849925498-0.4483191486437327', '{"id":"1752849925498-0.4483191486437327","name":"EDILSON LEHN IURAK","phone":"43999563742","email":"adv.edilsoniurak@gmail.com","address":"RUA JULIO GUERRA ","document":"09265730986"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755021416058', '{"id":"CUST-1755021416058","name":"EDUARDO ADVOCACIA JOÃO FÁBIO ","phone":"4399550648","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753450207598-0.10007602308299524', '{"id":"1753450207598-0.10007602308299524","name":"ERCIK (ADVOGADO)","phone":"43996297481","email":"TESTE@TESTE.COM","address":"AVENIDA TANCREDO NEVES ","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754676036325-0.5951418441783294', '{"id":"1754676036325-0.5951418441783294","name":"Edna (escola ivp)","phone":"43 99674040","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753808271066-0.49650695169797754', '{"id":"1753808271066-0.49650695169797754","name":"Escola ivaipoã. ","phone":"4396368113","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753462175779-0.4609024950462688', '{"id":"1753462175779-0.4609024950462688","name":"FERNANDO SANTILIO","phone":"43984310864","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755714675270', '{"id":"CUST-1755714675270","name":"Freitas e Goedert (advocacia)","phone":"(43) 88007242","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753213162582-0.24689435505478108', '{"id":"1753213162582-0.24689435505478108","name":"GRASIELLI BARRETO","phone":"43991855566","email":"grasibarreto@gmail.com","address":"RUA VOLTA REDONDA 90","document":"03182145983"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753899494042-0.7999042541784604', '{"id":"1753899494042-0.7999042541784604","name":"Geovana Dameto","phone":"43998563389","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755544671639', '{"id":"CUST-1755544671639","name":"Hotel Vilhar ","phone":"(43) ","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755263454416', '{"id":"CUST-1755263454416","name":"HÉLCIO CAMARGO","phone":"43999171304","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752765902944-0.6165074972827616', '{"id":"1752765902944-0.6165074972827616","name":"IVAIPLACAS","phone":"43999185358","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1758376530504', '{"id":"CUST-1758376530504","name":"JEFERSOM","phone":"43996024065","email":"jl.solucoes@hotmail.com","address":"RUA MARECHAL FLORIANO PEIXOTO, 80","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752777085090-0.3401838834676074', '{"id":"1752777085090-0.3401838834676074","name":"JOÃO MARCOS .( ADVOGADO)","phone":"4343999272236","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752587568423-0.36339501987805745', '{"id":"1752587568423-0.36339501987805745","name":"JULIANO JOSÉ PALMA ","phone":"43999157381","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753810500139-0.6009424666727826', '{"id":"1753810500139-0.6009424666727826","name":"LOJA CRAVO E CANELA","phone":"4399624315","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753809503437-0.9025694387682922', '{"id":"1753809503437-0.9025694387682922","name":"LOJA SÃO JORGE","phone":"4396104982","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753473064591-0.36867322269918235', '{"id":"1753473064591-0.36867322269918235","name":"MIRIAM (CLINICA TRANSITAR)","phone":"43999513736","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1756145231563', '{"id":"CUST-1756145231563","name":"Marcelo Kuplens","phone":"43 984239823","email":"TESTE@TESTE.COM","address":"Rua Marechal Floriano","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754069734836-0.6906194110984947', '{"id":"1754069734836-0.6906194110984947","name":"Moisés","phone":"43999703910","email":"TESTE@TESTE.COM","address":"Marechal Floriano, 80, Jardim Sao Domingos","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1756145623284', '{"id":"CUST-1756145623284","name":"OAB (subseção de Ivaiporã)","phone":"43 991429900","email":"TESTE@TESTE.COM","address":"","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755635137452', '{"id":"CUST-1755635137452","name":"RODOLF RODRIGUES DOS SANTOS ","phone":"43099162590","email":"","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753970052319-0.8173402287167776', '{"id":"1753970052319-0.8173402287167776","name":"Recanto do Charanga . ","phone":"43999880484","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1766167221700', '{"id":"CUST-1766167221700","name":"Ricardo ","phone":"43984353564","email":"","address":"","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753462460549-0.7193446136299082', '{"id":"1753462460549-0.7193446136299082","name":"SAUL BONIFÁCIO ","phone":"43996400082","email":"TESTE@TESTE.COM","address":"AV CASTELO BRANCO","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753808800516-0.2137008721545176', '{"id":"1753808800516-0.2137008721545176","name":"SERGINHO DESPACHANTE","phone":"4399618404","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753450011614-0.1346668511655149', '{"id":"1753450011614-0.1346668511655149","name":"SOLANGE PROFESSORA IDALIA ","phone":"43998613668","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753459548705-0.9262861638030454', '{"id":"1753459548705-0.9262861638030454","name":"SOLANGE PROFESSORA IDALIA ","phone":"43 998613668","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1758220211077', '{"id":"CUST-1758220211077","name":"TEREZA YOSHIE MAKITA ","phone":"43996049078","email":"","address":"AVENIDA BRASIL 1620","document":"43753082968"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1753725676728-0.46749367314875023', '{"id":"1753725676728-0.46749367314875023","name":"Taynara (NPJ)","phone":"43 999604973","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755547400857', '{"id":"CUST-1755547400857","name":"Thai Lanches","phone":"(43) 996062457","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1752611147131-0.8346904741613428', '{"id":"1752611147131-0.8346904741613428","name":"VALDECIR ALVARINO","phone":"4399140365","email":"ALVARINOVAL@HOTMAIL.COM","address":"TANCREDO NEVES 3030","document":"63829070900"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1755800979450', '{"id":"CUST-1755800979450","name":"Wagner Pizzaia ","phone":"43996466354","email":"","address":"Rua 15 novembro","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', '1754070009182-0.49963108040346793', '{"id":"1754070009182-0.49963108040346793","name":"Wiliam BRM","phone":"43996393242","email":"TESTE@TESTE.COM","address":"Avenida Minas gerais","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('customers', 'CUST-1766167122572', '{"id":"CUST-1766167122572","name":"teste 7","phone":"43996024065","email":"jl.solucoes@hotmail.com","address":"RUA MARECHAL FLORIANO PEIXOTO, 80","document":""}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1757964358787', '{"id":"PROD-1757964358787","name":"ADAPTADOR WIFI PR-802 150 MBPS","description":"ADAPTADOR WIFI USB","category":"Periféricos","quantity":0,"price":80,"costPrice":40,"minStock":0,"barcode":"PROD-1757964358787","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1757621717676', '{"id":"PROD-1757621717676","name":"CARREGADOR UNIVERSAL NOTEBOOK ","description":"Carregador Universal notebook com Pontas .","category":"peças","quantity":0,"price":125,"costPrice":64,"minStock":0,"barcode":"PROD-1757621717676","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755023269817', '{"id":"PROD-1755023269817","name":"COMPUTADOR DELL OPTPLEX","description":"SEMINOVO","category":"","quantity":1,"price":900,"costPrice":100,"minStock":0,"barcode":"PROD-1755023269817","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755882938841', '{"id":"PROD-1755882938841","name":"Cartucho HP 667 (preto)","description":"Original HP","category":"Suprimentos","quantity":0,"price":95,"costPrice":70,"minStock":0,"barcode":"PROD-1755882938841","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1758221405714', '{"id":"PROD-1758221405714","name":"GABINETE BASIC ","description":"","category":"","quantity":1,"price":1690,"costPrice":1190,"minStock":0,"barcode":"PROD-1758221405714","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1758221372506', '{"id":"PROD-1758221372506","name":"HD 1 TERA WESTERN DIGITAL ","description":"","category":"","quantity":0,"price":0,"costPrice":0,"minStock":0,"barcode":"PROD-1758221372506","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755268152485', '{"id":"PROD-1755268152485","name":"IMPRESSORA BROTHER MFC-8952DW ","description":"IMPRESSORA SEMI NOVA ","category":"peças","quantity":2,"price":1400,"costPrice":50,"minStock":0,"barcode":"PROD-1755268152485","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755714165400', '{"id":"PROD-1755714165400","name":"IMPRESSORA BROTHER MFC-8952DW ","description":"","category":"Periféricos","quantity":1,"price":1400,"costPrice":100,"minStock":0,"barcode":"PROD-1755714165400","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755542117492', '{"id":"PROD-1755542117492","name":"IMPRESSORA HP m428 fw ","description":"","category":"","quantity":1,"price":1600,"costPrice":100,"minStock":0,"barcode":"PROD-1755542117492","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1758221262770', '{"id":"PROD-1758221262770","name":"MEMORIA 8 GB DDR 4 ","description":"","category":"peças","quantity":1,"price":0,"costPrice":0,"minStock":0,"barcode":"PROD-1758221262770","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1757612203548', '{"id":"PROD-1757612203548","name":"MOUSE SEM FIO ","description":"MOUSE SEM FIO COM CARREGADOR ","category":"Periféricos","quantity":1,"price":85,"costPrice":25,"minStock":0,"barcode":"PROD-1757612203548","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1766167417007', '{"id":"PROD-1766167417007","name":"PELICULA FUSOR HP P1000","description":"","category":"peças","quantity":5,"price":80,"costPrice":30,"minStock":0,"barcode":"PROD-1766167417007","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1758221309578', '{"id":"PROD-1758221309578","name":"PLACA MAE MSI A320","description":"","category":"","quantity":1,"price":0,"costPrice":0,"minStock":0,"barcode":"PROD-1758221309578","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1758221224082', '{"id":"PROD-1758221224082","name":"PROCESSADOR ATHLON200GE","description":"","category":"peças","quantity":0,"price":0,"costPrice":0,"minStock":0,"barcode":"PROD-1758221224082","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1766167787827', '{"id":"PROD-1766167787827","name":"ROLETE DE TRAÇÃO DE PAPEL HP  P1000","description":"","category":"peças","quantity":5,"price":45,"costPrice":15,"minStock":0,"barcode":"PROD-1766167787827","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755259240754', '{"id":"PROD-1755259240754","name":"SSD 240 GIGA WD","description":"","category":"peças","quantity":1,"price":0,"costPrice":0,"minStock":0,"barcode":"PROD-1755259240754","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1757682089569', '{"id":"PROD-1757682089569","name":"TONNER BROTHER TN750","description":"TONNER COMPATIVÉL BROTHER TN750 12000 PÁGINAS.","category":"Suprimentos","quantity":-1,"price":130,"costPrice":46,"minStock":0,"barcode":"PROD-1757682089569","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755537408950', '{"id":"PROD-1755537408950","name":"Tinta Epson 544 (Azul)","description":"","category":"Suprimentos","quantity":1,"price":75,"costPrice":25,"minStock":0,"barcode":"PROD-1755537408950","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755537343646', '{"id":"PROD-1755537343646","name":"Tinta Epson 544 (Preta)","description":"","category":"Suprimentos","quantity":0,"price":75,"costPrice":25,"minStock":0,"barcode":"PROD-1755537343646","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755537298582', '{"id":"PROD-1755537298582","name":"Tinta Epson 544 (amarela)","description":"","category":"Suprimentos","quantity":1,"price":75,"costPrice":25,"minStock":0,"barcode":"PROD-1755537298582","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755537230951', '{"id":"PROD-1755537230951","name":"Tinta Epson 544 (magenta)","description":"","category":"Suprimento","quantity":1,"price":75,"costPrice":25,"minStock":0,"barcode":"PROD-1755537230951","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755535876701', '{"id":"PROD-1755535876701","name":"Tonner HP 283a","description":"","category":"peças","quantity":1,"price":70,"costPrice":30,"minStock":0,"barcode":"PROD-1755535876701","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('stock', 'PROD-1755535817613', '{"id":"PROD-1755535817613","name":"Tonner HP 285a","description":"","category":"peças","quantity":20,"price":50,"costPrice":21,"minStock":0,"barcode":"PROD-1755535817613","unitOfMeasure":"UN"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
COMMIT;
