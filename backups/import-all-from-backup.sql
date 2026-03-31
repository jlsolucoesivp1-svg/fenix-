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
VALUES ('serviceOrders', 'OS-1766167748146', '{"id":"OS-1766167748146","customerName":"Ricardo ","equipment":"Impressora HP P1102W","reportedProblem":"NÃO PUXA PAPEL ","status":"Aberta","date":"2025-12-19","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":245,"technicalReport":"EFETUADO DIAGNÓSTICO E CONSTATADO QUE O ROLETE DE TRAÇÃO DE PAPEL ESTAA GASTO SENDO NECESSÁRIO A TROCA , E QUE A SOLENÓIDE DE ACIONAMENTO DO SISTEMA DE TRAÇÃO ESTA DANIFICADA SENDO NECESSÁRIO REPARO .\nMANUTENÇÃO PREVENTIVA LIMPEZA INTERNA E EXTERNA LUBRIFICAÇÃO E AJUSTE DE MECANISMO.","accessories":"TONNER ","serialNumber":"","internalNotes":[],"payments":[],"items":[{"description":"MANUTENÇAO IMPRESSORA  LASER","quantity":1,"unitPrice":120,"type":"service","id":1766167835739},{"description":"ROLETE DE TRAÇÃO DE PAPEL HP  P1000","quantity":1,"unitPrice":45,"type":"part","id":1766167845909},{"description":"REPARO SOLENOIDE ","quantity":1,"unitPrice":80,"type":"service","id":1766167868367}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1766167363459', '{"id":"OS-1766167363459","customerName":"Ricardo ","equipment":"Impressora HP P1005","reportedProblem":"MANCHANDO IMPRESSÃO","status":"Aberta","date":"2025-12-19","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":200,"technicalReport":"EFETUADO DIAGNÓSTICO E COSNTATADO , QUE A PELICULA E O ROLO DA UNIDADE FUSORA ESTAO  DANIFICADOS SENDO NECESSÁRIO A TROCA . \nMANUTENÇÃO PREVENTIVA LIMPEZA INTERNA E EXTERNA LUBRIFICAÇÕES E AJUSTE DE MECANISMO ","accessories":"TONNER","serialNumber":"","internalNotes":[],"payments":[],"items":[{"description":"MANUTENÇÃO PREVENTIVA LASER","quantity":1,"unitPrice":120,"type":"service","id":1766167345005},{"description":"PELICULA FUSOR HP P1000","quantity":1,"unitPrice":80,"type":"part","id":1766167451368}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1758283116433', '{"id":"OS-1758283116433","customerName":"TEREZA YOSHIE MAKITA ","equipment":"COMPUTADOR","reportedProblem":"NAO LIGA ","status":"Aberta","date":"2025-09-19","deliveredDate":null,"attendant":"everaldo","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"Efetuado diagnóstico e constatado que o equipamento sofreu uma descarga elétrica vindo danificar a placa principal e a placa fonte . ficando inviavel reparo . \n Obs Cliente ja retirou o equipamento .","accessories":"","serialNumber":"","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1757946660138', '{"id":"OS-1757946660138","customerName":"FERNANDO SANTILIO","equipment":"NOTEBOOK ACER ASPIRE M5","reportedProblem":"FORMATAÇÃO ","status":"Aberta","date":"2025-09-15","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":90,"technicalReport":"","accessories":"COM FONTE ","serialNumber":"","internalNotes":[],"payments":[],"items":[{"description":"FORMATAÇÃO ","quantity":1,"unitPrice":90,"type":"service","id":1757946658698}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1757944604232', '{"id":"OS-1757944604232","customerName":"BOTTINI CALÇADOS ","equipment":"COMPUTADOR","reportedProblem":"FAZENDO BARULHO","status":"Finalizado","date":"2025-09-15","deliveredDate":"2025-09-15","attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":80,"technicalReport":"EFETUADO DIAGNÓSTICO , E CONSTATADO QUE O COOLER DA FONTE ESTA SECO NECESSÁRIO MANUTENÇÃO ,LIMPEZA DO SISTEMA REMOÇÃO DE ARQUIVOS DA PASTA TEMP .","accessories":"SEM ACESSÓRIO ","serialNumber":"","internalNotes":[],"payments":[],"items":[{"description":"MANUTENÇÃO COOLER DA FONTE ","quantity":1,"unitPrice":40,"type":"service","id":1757944588664},{"description":"LIMPEZA SISTEMA OPERACIONAL ","quantity":1,"unitPrice":40,"type":"service","id":1757944603176}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1756145668155', '{"id":"OS-1756145668155","customerName":"OAB (subseção de Ivaiporã)","equipment":"COMPUTADOR S/M SEM MODELO","reportedProblem":"Troca da Fonte","status":"Finalizado","date":"2025-08-25","deliveredDate":null,"attendant":"João Pedro Boeno Lopes","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":"","accessories":"S/A","serialNumber":"S/N","internalNotes":[],"payments":[{"id":"PAY-1756236532428-0","amount":120,"date":"2025-08-26","method":"Dinheiro"}],"items":[{"description":"fonte ","quantity":1,"unitPrice":120,"type":"service","id":1756236476716}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1756145364427', '{"id":"OS-1756145364427","customerName":"Marcelo Kuplens","equipment":"COMPUTADOR S/M S/M","reportedProblem":"Orçamento","status":"Finalizado","date":"2025-08-25","deliveredDate":null,"attendant":"João Pedro Boeno Lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"S/A","serialNumber":"S/N","internalNotes":[],"payments":[{"id":"PAY-1757613886071","amount":0,"date":"2025-09-11","method":"PIX"}],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1756142585464', '{"id":"OS-1756142585464","customerName":"Advocacia Júlio César da Costa","equipment":"NOTEBOOK ACER SEM MODELO","reportedProblem":"Lento ","status":"Entregue","date":"2025-08-25","deliveredDate":"2025-09-11","attendant":"João Pedro Boeno Lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"Carregador","serialNumber":"S/N","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755801190769', '{"id":"OS-1755801190769","customerName":"Wagner Pizzaia ","equipment":"Impressora EPSON L3250","reportedProblem":"NÃO SAI TINTA PRETA","status":"Entregue","date":"2025-08-21","deliveredDate":"2025-09-11","attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"S/A","serialNumber":"X5EU263836","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755801113219', '{"id":"OS-1755801113219","customerName":"Wagner Pizzaia ","equipment":"Impressora epson L3110","reportedProblem":"NÃO SAI TINTA ","status":"Finalizado","date":"2025-08-21","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":130,"technicalReport":"","accessories":"S/A","serialNumber":"X5EU074422","internalNotes":[],"payments":[{"id":"PAY-1756236651813","amount":130,"date":"2025-08-26","method":"PIX"}],"items":[{"description":"Manutenção preventiva + Recuperação cabeça de impressão ","quantity":1,"unitPrice":130,"type":"service","id":1756236635540}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755714794070', '{"id":"OS-1755714794070","customerName":"Freitas e Goedert (advocacia)","equipment":"Dois monitores S/M SEM MODELO","reportedProblem":"Não liga","status":"Cancelada","date":"2025-08-20","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"S/A","serialNumber":"S/N","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755714015342', '{"id":"OS-1755714015342","customerName":"Escola ivaipoã. ","equipment":"Impressora Brother MCP-8952w","reportedProblem":"Semi-nova","status":"Finalizado","date":"2025-08-20","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":1400,"technicalReport":"Venda","accessories":"Semi-nova","serialNumber":"S/N","internalNotes":[],"payments":[{"id":"PAY-1755714453063-entry","amount":500,"date":"2025-08-20","method":"Dinheiro"},{"id":"PAY-1757964124092","amount":900,"date":"2025-09-15","method":"Dinheiro"}],"items":[{"description":"Venda Impressora Brother","quantity":1,"unitPrice":1400,"type":"service","id":1755714424462}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755635393765', '{"id":"OS-1755635393765","customerName":"RODOLF RODRIGUES DOS SANTOS ","equipment":"COMPUTADOR","reportedProblem":"FOMATAÇÃO MAIS SSD","status":"Finalizado","date":"2025-08-19","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":360,"technicalReport":"","accessories":"S/A","serialNumber":"","internalNotes":[],"payments":[{"id":"PAY-1755713581398","amount":360,"date":"2025-08-20","method":"PIX"}],"items":[{"description":"Formatação + ssd 240 ","quantity":1,"unitPrice":360,"type":"service","id":1755697809876}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755547483138', '{"id":"OS-1755547483138","customerName":"Thai Lanches","equipment":"NOTEBOOK POSITIVO Unique S2460","reportedProblem":"Não liga","status":"Cancelada","date":"2025-08-18","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"Carregador","serialNumber":"S/N","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755546412313', '{"id":"OS-1755546412313","customerName":"APAC","equipment":"computador POSITIVO SEM MODELO","reportedProblem":"Formatação","status":"Aberta","date":"2025-08-18","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":880,"technicalReport":"","accessories":"S/A","serialNumber":"S/N","internalNotes":[],"payments":[],"items":[{"description":"FORMATAÇÃO ","quantity":1,"unitPrice":80,"type":"service","id":1755546343888},{"description":"FORMATAÇÃO ","quantity":10,"unitPrice":80,"type":"service","id":1755546407313}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755544815783', '{"id":"OS-1755544815783","customerName":"Hotel Vilhar ","equipment":"NO S/M S/M","reportedProblem":"Chamado Técnico","status":"Entregue","date":"2025-08-18","deliveredDate":"2025-09-11","attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":"","accessories":"","serialNumber":"S/N","internalNotes":[],"payments":[],"items":[{"description":"Configuração e compatilhamento de rede","quantity":1,"unitPrice":120,"type":"service","id":1755544763815}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755518045777', '{"id":"OS-1755518045777","customerName":"CLINICA HARMONIA ","equipment":"\\X\\ZX \\ZX\\ \\ZX","reportedProblem":"\\ZX","status":"Entregue","date":"2025-08-18","deliveredDate":"2025-08-18","attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"\\ZX\\","accessories":"\\ZX\\","serialNumber":"\\ZX\\","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755517885970', '{"id":"OS-1755517885970","customerName":"CLINICA HARMONIA ","equipment":"IMPRESSORA EPSON L3250","reportedProblem":"MECANISMO TRAVADO ","status":"Entregue","date":"2025-08-18","deliveredDate":"2025-08-26","attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":220,"technicalReport":"EFETUADO DIAGNÓSTICO E CONSTATADO A NECESSIDADE DE FAZER O RESET DA IMPRESSORA.","accessories":"SEM ACESSÓRIOS","serialNumber":"XAAB348012","internalNotes":[],"payments":[{"id":"PAY-1756148085679-0","amount":220,"date":"2025-08-25","method":"Dinheiro"},{"id":"PAY-1756148297381-0","amount":0,"date":"2025-08-25","method":"Dinheiro"},{"id":"PAY-1756236710316","amount":0,"date":"2025-08-26","method":"PIX"},{"id":"PAY-1756236865644","amount":0,"date":"2025-08-26","method":"PIX"}],"items":[{"description":"Manutenção preventiva + Recuperação cabeça de impressão ","quantity":1,"unitPrice":220,"type":"service","id":1756240681080}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755267116271', '{"id":"OS-1755267116271","customerName":"HÉLCIO CAMARGO","equipment":"NOTEBOOK Advocacia Arruda  RTYR","reportedProblem":"RTY","status":"Finalizado","date":"2025-08-15","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"RTYRT","accessories":"RTYR","serialNumber":"RTYR","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755267102334', '{"id":"OS-1755267102334","customerName":"HÉLCIO CAMARGO","equipment":"RTYRT RTY RTYR","reportedProblem":"RTYR","status":"Finalizado","date":"2025-08-15","deliveredDate":null,"attendant":"Wagner lopes","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"RTY","accessories":"RTY","serialNumber":"RTYR","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755109335950', '{"id":"OS-1755109335950","customerName":"ADVOCACIA Doutor Gilmar","equipment":"Computador S/A SEM MODELO","reportedProblem":"Chamado Técnico","status":"Finalizado","date":"2025-08-13","deliveredDate":null,"attendant":"João Pedro Boeno Lopes","paymentMethod":"Dinheiro","warranty":"90 dias","totalValue":50,"technicalReport":"","accessories":"S/a","serialNumber":"","internalNotes":[],"payments":[{"id":"PAY-1755267051614","amount":50,"date":"2025-08-15","method":"PIX"}],"items":[{"description":"Chamado Técnico ","quantity":1,"unitPrice":50,"type":"service","id":1755109380566}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755104379857', '{"id":"OS-1755104379857","customerName":"DIOU CARLOS ","equipment":"NOTEBOOK Dell SEM MODELO","reportedProblem":"Intalação de Office","status":"Finalizado","date":"2025-08-13","deliveredDate":null,"attendant":"João Pedro Boeno Lopes","paymentMethod":"Dinheiro","warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"","serialNumber":"S/N","internalNotes":[],"payments":[{"id":"PAY-1755267089222","amount":0,"date":"2025-08-15","method":"Dinheiro"}],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755027893457', '{"id":"OS-1755027893457","customerName":"Moisés","equipment":"COMPUTADOR LG ALL IN ONE","reportedProblem":"QUEBRAR SENHA ","status":"Finalizado","date":"2025-08-12","deliveredDate":null,"attendant":"Ana Leticia Boeno Lopes ","paymentMethod":"Dinheiro","warranty":"90 dias","totalValue":120,"technicalReport":"","accessories":"CARREGADOR ","serialNumber":"","internalNotes":[],"payments":[],"items":[{"description":"FORMATAÇÃO ","quantity":1,"unitPrice":120,"type":"service","id":1755028084063}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755019840428', '{"id":"OS-1755019840428","customerName":"CMEI PAULO FREIRE ","equipment":"NOTEBOOK","reportedProblem":"NÃO RECONHECE O HD","status":"Finalizado","date":"2025-08-12","deliveredDate":null,"attendant":"Ana Leticia Boeno Lopes ","paymentMethod":null,"warranty":"90 dias","totalValue":360,"technicalReport":"","accessories":"carregador ","serialNumber":"","internalNotes":[],"payments":[{"id":"PAY-1755518079835","amount":360,"date":"2025-08-18","method":"Dinheiro"}],"items":[{"description":"SSD 240 GIGA WD","quantity":1,"unitPrice":260,"type":"part","id":1755259263938},{"description":"FORMATAÇÃO E RECUPERAÇÃO DE DADOS.","quantity":1,"unitPrice":100,"type":"service","id":1755259291866}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', 'OS-1755000060241', '{"id":"OS-1755000060241","customerName":"DIOU CARLOS ","equipment":"NOTEBOOK THINKPAD 206S45D00","reportedProblem":"PERDEU A SENHA ","status":"Finalizado","date":"2025-08-12","deliveredDate":null,"attendant":"Master User","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":"CLIENTE PERDEU A SENHA DE LOGIN E O USUARIO ","accessories":"SEM ACESSORIOS ","serialNumber":"R90VLGTM","internalNotes":[{"user":"Master User","date":"2025-08-12T12:00:51.785Z","comment":"CLIENTE JA TEM UM NOTEBOOK HP AQUI NA ASSISTENCIA NAOP ESQUECER DE ENTREGAR JUNTO QUANDO A FORMATAÇÃO ESTIVER PRONTA"}],"payments":[{"id":"PAY-1755267219550","amount":120,"date":"2025-08-15","method":"PIX"}],"items":[{"description":"FORMATAÇÃO ","quantity":1,"unitPrice":80,"type":"service","id":1755000014185},{"description":"INSTALAÇÃO PACOTE OFFICE ","quantity":1,"unitPrice":40,"type":"service","id":1755267207910}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754747569338-0.2804594613089322', '{"id":"1754747569338-0.2804594613089322","customerName":"AROLDO (TOPOGEO)","equipment":{"type":"Notebook","brand":"LENOVO","model":"GAMING 15IHU6","serialNumber":"1111","id":"1754747569338-0.9698251159590605","clientId":"1754747446003-0.7680073229090186"},"reportedProblem":"NÃO RECONHECE ALGUNS EQUIPAMENTOS NA USB ","status":"Finalizado","date":"2025-08-09T13:52:49.338Z","deliveredDate":"2025-08-11T17:44:08.034Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":50,"technicalReport":null,"accessories":"BOLSA , CARREGADOR ","serialNumber":"1111","internalNotes":[],"payments":[],"items":[{"id":"id_1754934236859_d43gr6zw9","description":"Atualização","value":50,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754747312566-0.5102097805222529', '{"id":"1754747312566-0.5102097805222529","customerName":"DIOU CARLOS ","equipment":{"type":"Notebook","brand":"HP","model":"ELITE DRAGONFLY","serialNumber":"5CG014CMVS","id":"1754747312565-0.941644199909436","clientId":"1754747233450-0.6686105561895997"},"reportedProblem":"NÃO CARREGA BATERIA ","status":"Entregue","date":"2025-08-09T13:48:32.565Z","deliveredDate":"2025-08-18","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"CARREGADOR","serialNumber":"5CG014CMVS","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754676463969-0.10976517391454799', '{"id":"1754676463969-0.10976517391454799","customerName":"Escola ivaipoã. ","equipment":"kit tinta EPSON 544","reportedProblem":"S/D","status":"Finalizado","date":"2025-08-08T18:07:43.969Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":"Dinheiro","warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"S/A","serialNumber":"1111","internalNotes":[],"payments":[],"items":[{"id":"id_1754676499379_9e2o4ne0d","description":"kit de tinta ","value":130,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754676115155-0.6092888179753267', '{"id":"1754676115155-0.6092888179753267","customerName":"Edna (escola ivp)","equipment":{"type":"Notebook","brand":"POSITIVO","model":"SEM MODELO","serialNumber":"1111","id":"1754676115155-0.055233269238296634","clientId":"1754676036325-0.5951418441783294"},"reportedProblem":"Não liga","status":"Entregue","date":"2025-08-08T18:01:55.155Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"S/A","serialNumber":"1111","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754675884728-0.7570896407845296', '{"id":"1754675884728-0.7570896407845296","customerName":"Creusa Pereira Teixeira","equipment":"COMPUTADOR SEM MARCA SEM MODELO","reportedProblem":" Não liga","status":"Finalizado","date":"2025-08-08T17:58:04.727Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":"Dinheiro","warranty":"90 dias","totalValue":0,"technicalReport":"","accessories":"S/A","serialNumber":"1111","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754674306344-0.23649273038616858', '{"id":"1754674306344-0.23649273038616858","customerName":"AMPLA ARTEFATOS","equipment":{"type":"dfrgdfg","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"1111","id":"1754674306344-0.8677651707351619","clientId":"1753472685180-0.1180730707559845"},"reportedProblem":"Instalação de certificdo","status":"Finalizado","date":"2025-08-08T17:31:46.344Z","deliveredDate":"2025-08-08T17:32:15.724Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":60,"technicalReport":null,"accessories":"s/a","serialNumber":"1111","internalNotes":[],"payments":[],"items":[{"id":"id_1754934611420_t8y01a16y","description":"Chamado técnico","value":60,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754587008988-0.24629553469452448', '{"id":"1754587008988-0.24629553469452448","customerName":"CONCREVALI","equipment":{"type":"IMPRESSORA ","brand":"EPSON","model":"L6270","serialNumber":"X8G6002794","id":"1754587008988-0.3996075210633018","clientId":"1754586479771-0.3507579603855565"},"reportedProblem":"MANUTENÇÃO","status":"Finalizado","date":"2025-08-07T17:16:48.987Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"A/S","serialNumber":"X8G6002794","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754586595386-0.516255929758011', '{"id":"1754586595386-0.516255929758011","customerName":"CONCREVALI","equipment":{"type":"Notebook","brand":"ASUS","model":"TUF","serialNumber":"","id":"1754586595386-0.26056752334706523","clientId":"1754586479771-0.3507579603855565"},"reportedProblem":"FORMATAÇÃO","status":"Entregue","date":"2025-08-07T17:09:55.385Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"S/A","serialNumber":"","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754327946552-0.6291500893709898', '{"id":"1754327946552-0.6291500893709898","customerName":"Escola ivaipoã. ","equipment":{"type":"IMPRESSORA","brand":"HP","model":"M1132 MFP ","serialNumber":"CNG9CSTPNF","id":"1754327946552-0.796072142421661","clientId":"1753808271066-0.49650695169797754"},"reportedProblem":"não imprime","status":"Finalizado","date":"2025-08-04T17:19:06.551Z","deliveredDate":"2025-08-08T17:36:56.723Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":320,"technicalReport":"tonner","accessories":"A/S","serialNumber":"CNG9CSTPNF","internalNotes":[],"payments":[],"items":[{"id":"id_1754674601725_51h9i9bnm","description":"MANUTENÇÃO PREVENTIVA","value":320,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754070339086-0.8647001919528571', '{"id":"1754070339086-0.8647001919528571","customerName":"Carlos Ramos ","equipment":{"type":"Notebook","brand":"HP","model":"SEM MODELO","serialNumber":"ABC12345","id":"1754070339085-0.6921093269638879","clientId":"1754070290274-0.6204661443723137"},"reportedProblem":"Instalar auto-cad","status":"Finalizado","date":"2025-08-01T17:45:39.085Z","deliveredDate":"2025-08-08T14:58:18.196Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"Carregador.","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754070051452-0.31068840155690647', '{"id":"1754070051452-0.31068840155690647","customerName":"Wiliam BRM","equipment":{"type":"Notebook","brand":"HP","model":"SEM MODELO","serialNumber":"ABC12345","id":"1754070051452-0.0218784362151605","clientId":"1754070009182-0.49963108040346793"},"reportedProblem":" Semi novo","status":"Finalizado","date":"2025-08-01T17:40:51.452Z","deliveredDate":"2025-08-01T21:23:22.396Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":350,"technicalReport":null,"accessories":"Carregador","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1754070102714_ko18wy5qh","description":"Notebook Semi-novo","value":350,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754069884430-0.21759577112462958', '{"id":"1754069884430-0.21759577112462958","customerName":"Moisés","equipment":{"type":"COMPUTADOR","brand":"LG","model":"ALL IN ONE ","serialNumber":"","id":"1754069884430-0.15291277173090034","clientId":"1754069734836-0.6906194110984947"},"reportedProblem":"Quebrar senha ","status":"Finalizado","date":"2025-08-01T17:38:04.429Z","deliveredDate":"2025-08-08T17:48:28.711Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"Carregador","serialNumber":"","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754069617587-0.9460596986242767', '{"id":"1754069617587-0.9460596986242767","customerName":"Advocacia Makita","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1754069617587-0.5022244119083097","clientId":"1754069521071-0.5251903866898372"},"reportedProblem":"Não está ligando","status":"Finalizado","date":"2025-08-01T17:33:37.587Z","deliveredDate":"2025-08-11T19:46:16.547Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":3200,"technicalReport":null,"accessories":"Sem acessório","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1754941538463_xn6dpkgdt","description":"Teclado e mouse ","value":200,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754069281220-0.7957665175563264', '{"id":"1754069281220-0.7957665175563264","customerName":"COLÉGIO OBJETIVO","equipment":{"type":"IMPRESSORA","brand":"HP","model":"M1132","serialNumber":"ABC12345","id":"1754069281220-0.5262852605431804","clientId":"1753462813417-0.37245804640151114"},"reportedProblem":"Manchas nas folhas","status":"Entregue","date":"2025-08-01T17:28:01.220Z","deliveredDate":"2025-09-11","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":160,"technicalReport":"Impressora renata","accessories":"Toner","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1754068985978-0.7602921668104283', '{"id":"1754068985978-0.7602921668104283","customerName":"COLÉGIO OBJETIVO","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1754068985978-0.19311678544619193","clientId":"1753462813417-0.37245804640151114"},"reportedProblem":"Defeito no botão","status":"Finalizado","date":"2025-08-01T17:23:05.978Z","deliveredDate":"2025-08-01T20:32:31.607Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"S/a","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753970158581-0.896543906450536', '{"id":"1753970158581-0.896543906450536","customerName":"Recanto do Charanga . ","equipment":{"type":"computador + Nobreak","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753970158580-0.3376404310414942","clientId":"1753970052319-0.8173402287167776"},"reportedProblem":"Nobreak nao segura carga","status":"Entregue","date":"2025-07-31T13:55:58.580Z","deliveredDate":"2025-08-01T20:32:45.827Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":360,"technicalReport":"EFETUADO DIAGNOSTICO DO NOBREAK E CONSTATADO QUE A BATERIA ESTA DANIFICADA SENDO NECESSÁRIO A TROCA , MAIS A LIMPEZA DA PLACA E DOS COMPONENTES . \nCOMPUTADOR : NECESSÁRIO A LIMPEZA E A TROCA DA PASTA TERMICA DO PROCESSADOR . ","accessories":"sem acessórios","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753991650392_6slx00i9y","description":"Limpeza e Troca da pasta Térmica Computador.","value":120,"type":"service"},{"id":"id_1753991767840_44tq8v070","description":"MANUTENÇAO NOBREAK","value":50,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753899684156-0.1464488699022033', '{"id":"1753899684156-0.1464488699022033","customerName":"Geovana Dameto","equipment":{"type":"Notebook","brand":"Waio","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753899684155-0.7533147530701549","clientId":"1753899494042-0.7999042541784604"},"reportedProblem":"Não Carrega","status":"Finalizado","date":"2025-07-30T18:21:24.155Z","deliveredDate":"2025-08-04T20:15:15.316Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":260,"technicalReport":"Efetuado o teste e detectado que a fonte está com problema, sendo necessãrio a troca.","accessories":"Carregador, Sacola plástica preta.","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753895228205-0.42500250984599464', '{"id":"1753895228205-0.42500250984599464","customerName":"CIAMÁQUINAS OFFCE","equipment":{"type":"IMPRESSORA","brand":"EPSON","model":"L395","serialNumber":"ABC12345","id":"1753895228205-0.7506235150937457","clientId":"1752779276427-0.007760477428592205"},"reportedProblem":"Troca da cabeça de impressão","status":"Finalizado","date":"2025-07-30T17:07:08.205Z","deliveredDate":"2025-07-30T17:08:40.371Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":350,"technicalReport":"Efetuado a troca da cabeça de impressão","accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753985677003_b8irknzct","description":"MANUTENÇÃO PREVENTIVA","value":70,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753893597185-0.554549625402737', '{"id":"1753893597185-0.554549625402737","customerName":"IVAIPLACAS","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753893597185-0.35190225201007685","clientId":"1752765902944-0.6165074972827616"},"reportedProblem":"Não liga","status":"Finalizado","date":"2025-07-30T16:39:57.185Z","deliveredDate":"2025-07-30T18:59:43.888Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":129.9,"technicalReport":"Reparo no botão e na fonte","accessories":"s/a","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753989519413_xhv66wabj","description":"Reparo Botão + Fonte ","value":100,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753818704216-0.005102155434062117', '{"id":"1753818704216-0.005102155434062117","customerName":"COLÉGIO OBJETIVO","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753818704216-0.9833277608334858","clientId":"1753462813417-0.37245804640151114"},"reportedProblem":"NÃO ENTRA NO ACADESK","status":"Entregue","date":"2025-07-29T19:51:44.216Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753810560038-0.8388092309097275', '{"id":"1753810560038-0.8388092309097275","customerName":"LOJA CRAVO E CANELA","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753810560038-0.610365372354707","clientId":"1753810500139-0.6009424666727826"},"reportedProblem":"FORMATAÇÃO","status":"Finalizado","date":"2025-07-29T17:36:00.038Z","deliveredDate":"2025-07-30T18:59:55.143Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753809957569-0.1264459305724882', '{"id":"1753809957569-0.1264459305724882","customerName":"COLÉGIO OBJETIVO","equipment":{"type":"IMPRESSORA","brand":"HP","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753809957569-0.37761636748280536","clientId":"1753462813417-0.37245804640151114"},"reportedProblem":"tonner","status":"Entregue","date":"2025-07-29T17:25:57.569Z","deliveredDate":"2025-07-29T17:26:41.274Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":250,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753809608545-0.3044247025120962', '{"id":"1753809608545-0.3044247025120962","customerName":"LOJA SÃO JORGE","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753809608545-0.8293640238090713","clientId":"1753809503437-0.9025694387682922"},"reportedProblem":"SISTEMA CORROMPIDO","status":"Finalizado","date":"2025-07-29T17:20:08.545Z","deliveredDate":"2025-07-29T17:30:21.163Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":40,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753821347933_au0yrr55p","description":"CHAMADO TECNICO","value":40,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753809255220-0.9540555262461958', '{"id":"1753809255220-0.9540555262461958","customerName":"SERGINHO DESPACHANTE","equipment":{"type":"IMPRESSORA","brand":"HP","model":"LASER JET PRO M125A","serialNumber":"BRBSGDKQ59","id":"1753809255220-0.0758687656080731","clientId":"1753808800516-0.2137008721545176"},"reportedProblem":"MANCHANDO IMORESSÃO","status":"Finalizado","date":"2025-07-29T17:14:15.219Z","deliveredDate":"2025-07-29T18:32:59.957Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":null,"accessories":"TONNER","serialNumber":"BRBSGDKQ59","internalNotes":[],"payments":[],"items":[{"id":"id_1753814125928_y0de3w3r6","description":"MANUTENÇÃO PREVENTIVA","value":120,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753808378522-0.9339486682585703', '{"id":"1753808378522-0.9339486682585703","customerName":"Escola ivaipoã. ","equipment":{"type":"IMPRESSORA","brand":"HP","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753808378522-0.8325820784227088","clientId":"1753808271066-0.49650695169797754"},"reportedProblem":"Manchando a impressão","status":"Finalizado","date":"2025-07-29T16:59:38.522Z","deliveredDate":"2025-07-29T18:00:19.385Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":70,"technicalReport":"troca de toner","accessories":"s/a","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753725899746-0.13885061379280783', '{"id":"1753725899746-0.13885061379280783","customerName":"Taynara (NPJ)","equipment":{"type":"COMPUTADOR","brand":"LG","model":"ALL IN ONE ","serialNumber":"911BZVL000151","id":"1753725899746-0.04108625964776402","clientId":"1753725676728-0.46749367314875023"},"reportedProblem":"Formatação","status":"Finalizado","date":"2025-07-28T18:04:59.745Z","deliveredDate":"2025-07-29T17:38:00.065Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":null,"accessories":"Carregador, Cabo de força.","serialNumber":"911BZVL000151","internalNotes":[],"payments":[],"items":[{"id":"id_1753815148974_08e14gws2","description":"FORMATAÇÃO ","value":120,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753473122670-0.5395646439781595', '{"id":"1753473122670-0.5395646439781595","customerName":"MIRIAM (CLINICA TRANSITAR)","equipment":{"type":"Notebook","brand":"HP","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753473122670-0.6161299939051116","clientId":"1753473064591-0.36867322269918235"},"reportedProblem":"FORMATAÇÃO","status":"Finalizado","date":"2025-07-25T19:52:02.669Z","deliveredDate":"2025-07-25T19:52:56.902Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":160,"technicalReport":null,"accessories":"CARREGADOR, BOLSA","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753473161841_xmdtt8gm6","description":"FORMATAÇÃO, CALIBRAÇÃO DE BATERIA","value":160,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753472738791-0.6411266922624876', '{"id":"1753472738791-0.6411266922624876","customerName":"AMPLA ARTEFATOS","equipment":{"type":"CHMADO","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753472738791-0.7732630708491837","clientId":"1753472685180-0.1180730707559845"},"reportedProblem":"INSTALAÇÃO DE PROGRAMA","status":"Entregue","date":"2025-07-25T19:45:38.790Z","deliveredDate":"2025-07-25T19:46:52.009Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":90,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753472797418_z3v20nuo9","description":"INSTALAÇÃO DE PROGRAMAS JURÍDICOS","value":90,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753467395165-0.1102829461202256', '{"id":"1753467395165-0.1102829461202256","customerName":"COLÉGIO OBJETIVO","equipment":{"type":"IMPRESSORA","brand":"HP","model":"M127FN","serialNumber":"ABC12345","id":"1753467395165-0.04932464848487461","clientId":"1753462813417-0.37245804640151114"},"reportedProblem":"SEM DEFEITO","status":"Finalizado","date":"2025-07-25T18:16:35.165Z","deliveredDate":"2025-07-25T18:27:46.798Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":860,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753462544732-0.10222543453026567', '{"id":"1753462544732-0.10222543453026567","customerName":"SAUL BONIFÁCIO ","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753462544731-0.7309223360319846","clientId":"1753462460549-0.7193446136299082"},"reportedProblem":"ATIVAÇÃO OFFICE","status":"Entregue","date":"2025-07-25T16:55:44.731Z","deliveredDate":"2025-07-25T16:56:09.858Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":60,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753462621299_z8ytvcjoh","description":"INSTALAÇÃO LIBRE OFFICE","value":60,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753462241466-0.47594789887725264', '{"id":"1753462241466-0.47594789887725264","customerName":"FERNANDO SANTILIO","equipment":{"type":"Notebook","brand":"ACER","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753462241466-0.33608351678995474","clientId":"1753462175779-0.4609024950462688"},"reportedProblem":"COMPACTAR PDF","status":"Finalizado","date":"2025-07-25T16:50:41.466Z","deliveredDate":"2025-07-25T16:51:44.944Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":40,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[{"id":"PAY-1757613933718","amount":40,"date":"2025-09-11","method":"Dinheiro"}],"items":[{"id":"id_1753462288443_pdxjqblfe","description":"CHAMADO TECNICO","value":40,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753462078972-0.46191923446167793', '{"id":"1753462078972-0.46191923446167793","customerName":"ERCIK (ADVOGADO)","equipment":{"type":"Notebook","brand":"ACER","model":"SEM MODELO","serialNumber":"ABC12345","id":"1753462078972-0.23195883398490158","clientId":"1753450207598-0.10007602308299524"},"reportedProblem":"FORMATAÇÃO, DOBRADIÇA QUEBRADA","status":"Finalizado","date":"2025-07-25T16:47:58.971Z","deliveredDate":"2025-07-28T20:20:26.522Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":null,"accessories":"S/A","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753735911616_4sw2ojk07","description":"Recuperação carcaça","value":120,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753461776923-0.7998133933672857', '{"id":"1753461776923-0.7998133933672857","customerName":"CMEI ODETE BRASIL ","equipment":{"type":"IMPRESSORA","brand":"EPSON","model":"L4260","serialNumber":"XAA9293693","id":"1753461776923-0.07970039068446721","clientId":"1753461605858-0.8713826447317187"},"reportedProblem":"MANUTENÇÃO","status":"Entregue","date":"2025-07-25T16:42:56.923Z","deliveredDate":"2025-07-28T12:12:35.813Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":"EFETUADO DIAGNÓSTICO E CONSTATADO QUE A IMPRESSORA ESTAVA COM AS ALMOFADAS CARREGADSA SENDO A NECESSÁRIO A TROCA E A MANUTENÇÃO PREVENTIVA (LIMPEZA INTERNA E EXTERNA , LUBRIFICAÇÕES E AJUSTE DE MECANISMO .","accessories":"S/A","serialNumber":"XAA9293693","internalNotes":[],"payments":[],"items":[{"id":"id_1753704634707_tqcvu1yeo","description":"MANUTENÇÃO PREVENTIVA ","value":120,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753459665344-0.14380947187319992', '{"id":"1753459665344-0.14380947187319992","customerName":"SOLANGE PROFESSORA IDALIA ","equipment":{"type":"Notebook","brand":"DELL","model":"INSPIRON 3501","serialNumber":"ABC12345","id":"1753459665344-0.502806137614745","clientId":"1753459548705-0.9262861638030454"},"reportedProblem":"NÃO CARREGA","status":"Finalizado","date":"2025-07-25T16:07:45.344Z","deliveredDate":"2025-07-28T19:14:36.502Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":380,"technicalReport":"DC JACK QUEBRADO","accessories":"BOLSA, CARREGADOR","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1753462353019_ytv3y3b3e","description":"TROCA DC JACK","value":380,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753379126419-0.7429841024912682', '{"id":"1753379126419-0.7429841024912682","customerName":"ADVOCACIA LINCON","equipment":"COMPUTADOR S/M S/M","reportedProblem":"TRAVANDO ","status":"Aguardando Pagamento","date":"2025-07-24T17:45:26.419Z","deliveredDate":null,"attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":950,"technicalReport":"CLIENTE SOLICITOU A RECUPERAÇÃO DOS DADOS ","accessories":"SEM ACESSORIOS ","serialNumber":"111","internalNotes":[],"payments":[{"id":"PAY-1755193178505-entry","amount":475,"date":"2025-08-14","method":"Dinheiro"}],"items":[{"description":"COMPUTADOR DELL OPTPLEX","quantity":1,"unitPrice":900,"type":"part","id":1755109570951},{"description":"teclado usb","quantity":1,"unitPrice":50,"type":"service","id":1755193151842}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753283874696-0.7675854352578476', '{"id":"1753283874696-0.7675854352578476","customerName":"Dra Leila ","equipment":{"type":"PENDRIVE ","brand":"SANDISK","model":"CRUZER BLADE","serialNumber":"123","id":"1753283874696-0.4220606759524971","clientId":"1753283722550-0.9771248242925842"},"reportedProblem":"ARQUIVOS DANIFICADOS E CORROMPIDOS ","status":"Finalizado","date":"2025-07-23T15:17:54.696Z","deliveredDate":"2025-07-28T17:11:51.312Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":0,"technicalReport":"RECUPERAÇÃO DE ARQUIVOS ","accessories":"SEM ACESSORIOS","serialNumber":"123","internalNotes":[],"payments":[],"items":[]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1753213215866-0.27621967001524383', '{"id":"1753213215866-0.27621967001524383","customerName":"GRASIELLI BARRETO","equipment":{"type":"Notebook","brand":"VAYO","model":"VVV","serialNumber":"SM","id":"1753213215866-0.9418849483530518","clientId":"1753213162582-0.24689435505478108"},"reportedProblem":"INSTALAR OFFICE ","status":"Entregue","date":"2025-07-22T19:40:15.866Z","deliveredDate":"2025-07-22T19:59:33.180Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":60,"technicalReport":null,"accessories":"COM CRREGADOR ","serialNumber":"SM","internalNotes":[],"payments":[],"items":[{"id":"id_1753213272675_ixpe7q97z","description":"INSTALAR PACOTTE OFFICE ","value":60,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752779410369-0.32822606573457314', '{"id":"1752779410369-0.32822606573457314","customerName":"CIAMÁQUINAS OFFCE","equipment":{"type":"IMPRESSORA","brand":"EPSON","model":"L395","serialNumber":"X2NZ374777","id":"1752779410369-0.5975560298355475","clientId":"1752779276427-0.007760477428592205"},"reportedProblem":"NÃO IMPRIME ","status":"Finalizado","date":"2025-07-17T19:10:10.367Z","deliveredDate":"2025-07-22T18:03:00.114Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":350,"technicalReport":"EFETUADO DIAGNOSTICO CONSTADO QUE A CABEÇA DE IMPRESSÃO ESTA DANIFICADA SENDO NECESSARIO A TROCA.","accessories":"SEM ACESSORIO","serialNumber":"X2NZ374777","internalNotes":[],"payments":[],"items":[{"id":"id_1753207459084_c59xlc8te","description":"MANUTENÇAO PREVENTIVA ","value":70,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752777236701-0.4927395514167461', '{"id":"1752777236701-0.4927395514167461","customerName":"JOÃO MARCOS .( ADVOGADO)","equipment":{"type":"Notebook","brand":"DELL","model":"INSPIRON 15","serialNumber":"28086073417","id":"1752777236701-0.8449981107624771","clientId":"1752777085090-0.3401838834676074"},"reportedProblem":"UPGRADE DE PEÇAS ","status":"Entregue","date":"2025-07-17T18:33:56.701Z","deliveredDate":"2025-07-18T17:30:53.343Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":150,"technicalReport":"CLIENTE SOLICITA O UPGRADE DE SSD E DE MEMÓRIAS  \nOBS. PEÇAS FORNECEIDAS PELO CLIENTE ","accessories":"CARREGADOR E CABO DE FORÇA , LEITOR DE CD ORIGINAL ","serialNumber":"28086073417","internalNotes":[{"id":"id_1752777309201_ysqp8wslo","userId":"1752520921537-0.9328935433699823","userName":"Wagner Lopes","timestamp":"2025-07-17T18:35:09.201Z","text":"CLIENTE TROUXE AS PEÇAS QUER QUE RETIRE O ADAPTADOR E VOLTE O LEITOR DE CD . CLIENTE TROUXE O LEITOR DE CD ORIGINAL ."}],"payments":[],"items":[{"id":"id_1752777268929_09wm7e767","description":"MAO DE OBRA UPGRADE PEÇAS NOTEBOOK ","value":150,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752766038863-0.633127456261339', '{"id":"1752766038863-0.633127456261339","customerName":"IVAIPLACAS","equipment":{"type":"IMPRESSORA","brand":"EPSON","model":"L375","serialNumber":"WBJK226305","id":"1752766038863-0.20575460493877407","clientId":"1752765902944-0.6165074972827616"},"reportedProblem":"CORREIA ARREBENTADA","status":"Entregue","date":"2025-07-17T15:27:18.863Z","deliveredDate":"2025-07-17T15:33:09.652Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":180,"technicalReport":"EFETUADO DIAGNOSTICO E CONSTATADO QUE A CORREIA ESTAVA ARREBENTADA E GASTA AS ENGRENAGENS DO SISTEMA DO CARRO DE IMPRESSÃO TAMBEM ESTÃO GASTAS NECESSARIO TROCA .","accessories":"SEM ACESSORIOS","serialNumber":"WBJK226305","internalNotes":[{"id":"id_1752766425749_1zpx74ur9","userId":"1752520921537-0.9328935433699823","userName":"Wagner Lopes","timestamp":"2025-07-17T15:33:45.749Z","text":"EFETUADO A TROCA DA CORREIA (ROBERTO)"}],"payments":[],"items":[{"id":"id_1752766220421_6ev8ibd9x","description":"MAO DE OBRA ","value":40,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752611303031-0.7760006876203803', '{"id":"1752611303031-0.7760006876203803","customerName":"VALDECIR ALVARINO","equipment":{"type":"IMPRESSORA","brand":"EPSON ","model":"L3150","serialNumber":"ABC12345","id":"1752611303031-0.37063881780163666","clientId":"1752611147131-0.8346904741613428"},"reportedProblem":"NAO IMPRIME ","status":"Entregue","date":"2025-07-15T20:28:23.031Z","deliveredDate":"2025-07-18T18:38:12.329Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":"MANUTENÇAO PREVENTIVA LIMPEZA INTERNA EXTERNA LUBRIFICAÇOES E AJUSTE DE MECANISMO . DESINTUPIR MANGUEIRAS E CABEÇA DE IMPRESSÃO ","accessories":"","serialNumber":"ABC12345","internalNotes":[{"id":"id_1752781667358_96ur88cd5","userId":"1752520921537-0.9328935433699823","userName":"Wagner Lopes","timestamp":"2025-07-17T19:47:47.358Z","text":"PSSADO VALOR TOTAL JUNTAMENTE COM O COMPUTADOR 220,00"}],"payments":[],"items":[{"id":"id_1752781641205_zog5xyqbs","description":"MANUTENÇÃO PREVENTIVA ","value":120,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752611194334-0.4733699327957318', '{"id":"1752611194334-0.4733699327957318","customerName":"VALDECIR ALVARINO","equipment":{"type":"COMPUTADOR","brand":"HP","model":"ALL IN ONE ","serialNumber":"ABC12345","id":"1752611194334-0.3852978845903745","clientId":"1752611147131-0.8346904741613428"},"reportedProblem":"NÃO ENTRA NO WINDOS ","status":"Entregue","date":"2025-07-15T20:26:34.333Z","deliveredDate":"2025-07-18T18:38:24.103Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":80,"technicalReport":"ATUALIZAÇÃO DE SISTEMA E APLICATIVOS ","accessories":"CARREGADOR","serialNumber":"ABC12345","internalNotes":[{"id":"id_1752781735261_lizb0agp5","userId":"1752520921537-0.9328935433699823","userName":"Wagner Lopes","timestamp":"2025-07-17T19:48:55.261Z","text":"PASSADO VALOR JUNTO COM A IMPRESSORA 220,00"}],"payments":[],"items":[{"id":"id_1752781715589_506hp69yj","description":"ATUALIZAÇÃO DE SISTEMA","value":80,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752591164026-0.16961268312957978', '{"id":"1752591164026-0.16961268312957978","customerName":"CLIENTE AVULSO","equipment":{"type":"COMPUTADOR","brand":"HP","model":"ALL IN ONE ","serialNumber":"ABC12345","id":"1752591164026-0.9092236190630624","clientId":"1752591100370-0.5475282037034886"},"reportedProblem":"LENTO NAO ENTRA NO WINDOWS","status":"Finalizado","date":"2025-07-15T14:52:44.026Z","deliveredDate":"2025-07-15T14:53:06.829Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":150,"technicalReport":"TROCA HD PO SSD CLIENTE TROUXE SSD","accessories":"CARREGADOR ","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1752591265855_xj3hsj91y","description":"FORMATAÇÃO +MONTAGEM ","value":150,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752587625121-0.4228871275677658', '{"id":"1752587625121-0.4228871275677658","customerName":"JULIANO JOSÉ PALMA ","equipment":{"type":"COMPUTADOR","brand":"GENÉRICO","model":"SM","serialNumber":"ABC12345","id":"1752587625121-0.3989865236801051","clientId":"1752587568423-0.36339501987805745"},"reportedProblem":"NÃO ENTRA NO WINDOWS ","status":"Entregue","date":"2025-07-15T13:53:45.121Z","deliveredDate":"2025-07-15T20:41:51.692Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":380,"technicalReport":"EFETUADO DIAGNOSTICO E CONSTATADO . QUE O hd ESTA DANIFICADO SENDO NECESSÁRIO A SUBSTITUIÇÃO POR UM SSD ","accessories":"SEM ACESSORIOS","serialNumber":"ABC12345","internalNotes":[{"id":"id_1752601324547_h4zno6cw3","userId":"1752520921537-0.9328935433699823","userName":"Wagner Lopes","timestamp":"2025-07-15T17:42:04.547Z","text":"TROCAR SSD VALOR PASSADO PARA O CLIENTE 380,00\nBKP DOS DADOS JA FOI FEITO"}],"payments":[],"items":[{"id":"id_1752608982815_d6s46x9c2","description":"FORMATAÇÃO  + CONFIGURAÇÃO SSD ","value":100,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752581466827-0.8915826343848778', '{"id":"1752581466827-0.8915826343848778","customerName":"CINE FOTO REGINA ","equipment":{"type":"IMPRESSORA ","brand":"BROTHER","model":"DCP-T830","serialNumber":"U67681F4H848003","id":"1752581466827-0.8791945667285874","clientId":"1752581309250-0.23832530068551883"},"reportedProblem":"ENROSCANDO PAPEL QUANDO IMPRIME FRENTE E VERSO","status":"Entregue","date":"2025-07-15T12:11:06.827Z","deliveredDate":"2025-07-15T22:11:19.195Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":130,"technicalReport":"EFEYUADO DIAGNOSTICO E CONSTATADO PAPEL ENROSCADO NO MECANISMO NECESSARIO INTERVENÇAO TECNICA ","accessories":"SEM ACESSÓRIOS","serialNumber":"U67681F4H848003","internalNotes":[],"payments":[],"items":[{"id":"id_1752617329268_5gshkzc68","description":"MANUTENÇAO PREVENTIVA ","value":130,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752525205781-0.222365992264843', '{"id":"1752525205781-0.222365992264843","customerName":"ARMAZEM NATUREBA","equipment":{"type":"IMPRESSORA","brand":"HP","model":"LJ 1020","serialNumber":"ABC12345","id":"1752525205780-0.16828237228810683","clientId":"1752525160400-0.21769594684339721"},"reportedProblem":"ENROSCANDO PAPEL ","status":"Entregue","date":"2025-07-14T20:33:25.780Z","deliveredDate":"2025-07-14T20:35:01.719Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":null,"accessories":"TONNER","serialNumber":"ABC12345","internalNotes":[],"payments":[],"items":[{"id":"id_1752525258941_9m864r5dl","description":"MANUTENÇÕ PREVENTIVA ","value":120,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752524270527-0.30751067415024125', '{"id":"1752524270527-0.30751067415024125","customerName":"CESTA BASICA SANTA RITA","equipment":{"type":"Notebook","brand":"ACER","model":"ASPIRE 3","serialNumber":"ABC12345","id":"1752524270527-0.9724207698061066","clientId":"1752524196787-0.21135363759111103"},"reportedProblem":"DOBRADIÇAS QUEBRADAS","status":"Entregue","date":"2025-07-14T20:17:50.527Z","deliveredDate":"2025-07-21T13:46:27.073Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":300,"technicalReport":"EFETUADO DIAGNÓSTICO E CONSTATADO QUE A TAMPA ESTA QUEBRADA SENDO NECESS´RIO A TROCA .","accessories":"SEM ACESSORIOS","serialNumber":"ABC12345","internalNotes":[{"id":"id_1752591568191_7txq5sbx1","userId":"1752520921537-0.9328935433699823","userName":"Wagner Lopes","timestamp":"2025-07-15T14:59:28.191Z","text":"CLIENTE JA FOI INFORMADO SOBRE O VALOR DO ORÇAMENTO , FALTA PEDIR A TAMPA , VALOR PASSADO DA TAMPA 240,00, VALOR DA MAO DE OBRA 60,00\nVALOR DE CUSTO DA TAMPA 170,00. TOTAL DOS SERVIÇOS 300,00"}],"payments":[],"items":[{"id":"id_1753101404560_9e4ygfo1x","description":"MONTAGEM TROCA DA TAMPA","value":60,"type":"service"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('serviceOrders', '1752520779948-0.508259989288888', '{"id":"1752520779948-0.508259989288888","customerName":"ADVOCACIA JOÃO FABIO HILARIO (fILHO)","equipment":{"type":"COMPUTADOR","brand":"SEM MARCA","model":"SEM MODELO","serialNumber":"1111","id":"1752520779948-0.2685609538229643","clientId":"1752520699538-0.03593661342012322"},"reportedProblem":"NÃO RECONHECE SSD","status":"Entregue","date":"2025-07-14T19:19:39.948Z","deliveredDate":"2025-07-16T21:06:39.949Z","attendant":"Sistema","paymentMethod":null,"warranty":"90 dias","totalValue":120,"technicalReport":"EFETUADO DIAGNOSTICO E CONSTATADO  QUE O SSD M2 ESTA DANIFICADO SENDO NECESSÁRIO TROCA ","accessories":"SEM TAMPA LATERAL E COM OS COOLER SOLTOS ","serialNumber":"1111","internalNotes":[],"payments":[],"items":[{"id":"id_1752600275465_lcqfbg4ag","description":"FORMATAÇÃO ","value":120,"type":"service"}]}'::jsonb, NOW())
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
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1758376732519', '{"id":"SALE-1758376732519","date":"2025-09-20","time":"10:58:52","user":"EVERALDO GRIGOLETTO","subtotal":150,"discount":0,"total":150,"paymentMethod":"parcelado","observations":"JA ESTA DEVENDO 20,00","customerId":"CUST-1758376530504","relatedQuoteId":null,"status":"Estornada","reversalReason":"KK","items":[{"name":"PÃO CASEIRO","price":15,"quantity":10,"id":"ITEM-1758376670923"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1758221814169', '{"id":"SALE-1758221814169","date":"2025-09-18","time":"15:56:54","user":"Wagner lopes","subtotal":1690,"discount":0,"total":1690,"paymentMethod":"A definir","observations":"Venda gerada a partir do orçamento #756673.","customerId":"CUST-1758220211077","relatedQuoteId":"QUOTE-1758221756673","status":null,"reversalReason":null,"items":[{"id":"PROD-1758221309578","name":"PLACA MAE MSI A320","price":0,"quantity":1},{"id":"PROD-1758221224082","name":"PROCESSADOR ATHLON200GE","price":0,"quantity":1},{"id":"PROD-1758221262770","name":"MEMÓRIA 8 GB DDR 4 ","price":0,"quantity":1},{"id":"PROD-1755259240754","name":"SSD 240 GIGA WD","price":0,"quantity":1},{"id":"PROD-1758221372506","name":"HD 1 TERA WESTERN DIGITAL ","price":0,"quantity":1},{"id":"PROD-1758221405714","name":"GABINETE BASIC ","price":1690,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1757964436883', '{"id":"SALE-1757964436883","date":"2025-09-15","time":"16:27:20","user":"Wagner lopes","subtotal":130,"discount":0,"total":130,"paymentMethod":"pix","observations":"VIVIANE . MORA PERTO DO ALCEBIADES ","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1757964358787","name":"ADAPTADOR WIFI PR-802 150 MBPS","price":80,"quantity":1},{"name":"INSTALAÇAO E MONTAGEM DO COMPUTADOR ","price":50,"quantity":1,"id":"ITEM-1757964411131"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1757943338308', '{"id":"SALE-1757943338308","date":"2025-09-15","time":"10:35:42","user":"Wagner lopes","subtotal":165,"discount":0,"total":165,"paymentMethod":"a_prazo","observations":"Hub Colégio Objetivo ","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"name":"Hub 8 Portas Intelbras ","price":165,"quantity":1,"id":"ITEM-1757943320804"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1757682171249', '{"id":"SALE-1757682171249","date":"2025-09-12","time":"10:02:56","user":"Wagner lopes","subtotal":130,"discount":0,"total":130,"paymentMethod":"pix","observations":"ESCOLA IVAIPORÃ.","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1757682089569","name":"TONNER BROTHER TN750","price":130,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1757677436315', '{"id":"SALE-1757677436315","date":"2025-09-12","time":"08:43:56","user":"Wagner lopes","subtotal":125,"discount":0,"total":125,"paymentMethod":"credito","observations":"Professor Pedro Advogado ","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1757621717676","name":"CARREGADOR UNIVERSAL NOTEBOOK ","price":125,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1757612266468', '{"id":"SALE-1757612266468","date":"2025-09-11","time":"14:37:49","user":"Wagner lopes","subtotal":85,"discount":0,"total":85,"paymentMethod":"a_prazo","observations":"COLÉGIO OBJETIVO","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1757612203548","name":"MOUSE SEM FIO ","price":85,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1755883690891', '{"id":"SALE-1755883690891","date":"2025-08-22","time":"14:28:12","user":"João Pedro Boeno Lopes","subtotal":75,"discount":0,"total":75,"paymentMethod":"pix","observations":"","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1755537343646","name":"Tinta Epson 544 (Preta)","price":75,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1755883641155', '{"id":"SALE-1755883641155","date":"2025-08-22","time":"14:27:23","user":"João Pedro Boeno Lopes","subtotal":115,"discount":0,"total":115,"paymentMethod":"pix","observations":"","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1755882938841","name":"Cartucho HP 667 (preto)","price":95,"quantity":1},{"name":"Recarga de cartucho colorido 667","price":20,"quantity":1,"id":"ITEM-1755883630506"}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1755537902335', '{"id":"SALE-1755537902335","date":"2025-08-18","time":"14:25:02","user":"Wagner lopes","subtotal":140,"discount":0,"total":140,"paymentMethod":"parcelado","observations":"","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1755535876701","name":"Tonner HP 283a","price":70,"quantity":2}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('sales', 'SALE-1755537703615', '{"id":"SALE-1755537703615","date":"2025-08-18","time":"14:22:45","user":"Wagner lopes","subtotal":600,"discount":0,"total":600,"paymentMethod":"parcelado","observations":"","customerId":null,"relatedQuoteId":null,"status":null,"reversalReason":null,"items":[{"id":"PROD-1755537230951","name":"Tinta Epson 544 (magenta)","price":75,"quantity":2},{"id":"PROD-1755537298582","name":"Tinta Epson 544 (amarela)","price":75,"quantity":2},{"id":"PROD-1755537343646","name":"Tinta Epson 544 (Preta)","price":75,"quantity":2},{"id":"PROD-1755537408950","name":"Tinta Epson 544 (Azul)","price":75,"quantity":2}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1758376733404-0', '{"id":"FIN-1758376733404-0","type":"receita","description":"[ESTORNADO] Cliente: JEFERSOM | Produto(s): PÃO CASEIRO | Parcelamento: 1/1 de R$ 150.00 | Pagamento: parcelado | Valor Total: R$ 150.00 | Vencimento: 26/09/2025 | Data: 19/09/2025 | Motivo: KK","amount":150,"date":"2025-09-20","dueDate":"2025-09-26","status":"Estornado","category":"Venda Estornada","paymentMethod":"parcelado","relatedSaleId":"SALE-1758376732519","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1758221814169', '{"id":"FIN-1758221814169","type":"receita","description":"Recebimento da Venda #814169","amount":1690,"date":"2025-09-18","dueDate":null,"status":null,"category":"Venda de Produto","paymentMethod":"A definir","relatedSaleId":"SALE-1758221814169","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757964440744', '{"id":"FIN-1757964440744","type":"receita","description":"Venda de Produtos (PDV)","amount":130,"date":"2025-09-15","dueDate":null,"status":"pago","category":"Venda de Produto","paymentMethod":"pix","relatedSaleId":"SALE-1757964436883","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757964124092', '{"id":"FIN-1757964124092","type":"receita","description":"Pagamento integral OS #5342","amount":900,"date":"2025-09-15","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755714015342"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757944698568-0', '{"id":"FIN-1757944698568-0","type":"receita","description":"Parcela 1/1 OS #4232","amount":80,"date":"2025-09-15","dueDate":"2025-09-17","status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1757944604232"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757943342795', '{"id":"FIN-1757943342795","type":"receita","description":"Venda a prazo #338308","amount":165,"date":"2025-09-15","dueDate":"2025-10-15","status":"pendente","category":"Venda de Produto","paymentMethod":"A prazo","relatedSaleId":"SALE-1757943338308","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757612269752', '{"id":"FIN-1757612269752","type":"receita","description":"Venda a prazo #266468","amount":85,"date":"2025-09-15","dueDate":"2025-10-11","status":"pago","category":"Venda de Produto","paymentMethod":"A prazo","relatedSaleId":"SALE-1757612266468","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755537765707-0', '{"id":"FIN-1755537765707-0","type":"receita","description":"Parcela 1/1 - Venda #703615","amount":600,"date":"2025-09-15","dueDate":"2025-09-18","status":"pago","category":"Venda de Produto","paymentMethod":"parcelado","relatedSaleId":"SALE-1755537703615","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755714453063-0', '{"id":"FIN-1755714453063-0","type":"receita","description":"Parcela 1/3 OS #5342","amount":300,"date":"2025-09-15","dueDate":"2025-09-20","status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755714015342"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757682176837', '{"id":"FIN-1757682176837","type":"receita","description":"Venda de Produtos (PDV)","amount":130,"date":"2025-09-12","dueDate":null,"status":"pago","category":"Venda de Produto","paymentMethod":"pix","relatedSaleId":"SALE-1757682171249","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757677436320', '{"id":"FIN-1757677436320","type":"receita","description":"Venda de Produtos (PDV)","amount":125,"date":"2025-09-12","dueDate":null,"status":"pago","category":"Venda de Produto","paymentMethod":"credito","relatedSaleId":"SALE-1757677436315","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757613933718', '{"id":"FIN-1757613933718","type":"receita","description":"Pagamento integral OS #5264","amount":40,"date":"2025-09-11","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"1753462241466-0.47594789887725264"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1757613886071', '{"id":"FIN-1757613886071","type":"receita","description":"Pagamento integral OS #4427","amount":0,"date":"2025-09-11","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":"OS-1756145364427"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1756240852065', '{"id":"FIN-1756240852065","type":"receita","description":"Clínica Harmonia","amount":220,"date":"2025-08-26","dueDate":null,"status":null,"category":"Outra Receita","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1756240786720', '{"id":"FIN-1756240786720","type":"despesa","description":"Farmácia Remédio Ana","amount":29.8,"date":"2025-08-26","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1756240743185', '{"id":"FIN-1756240743185","type":"despesa","description":"Farmácia ","amount":6.5,"date":"2025-08-26","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1756240641929', '{"id":"FIN-1756240641929","type":"receita","description":"RECARGA CARTUCHO PRETO","amount":30,"date":"2025-08-26","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1756236651813', '{"id":"FIN-1756236651813","type":"receita","description":"Pagamento integral OS #3219","amount":130,"date":"2025-08-26","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":"OS-1755801113219"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1756142150608', '{"id":"FIN-1756142150608","type":"despesa","description":"Compra de copos ","amount":11.08,"date":"2025-08-25","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Cartão de Crédito","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755883692285', '{"id":"FIN-1755883692285","type":"receita","description":"Venda de Produtos (PDV)","amount":75,"date":"2025-08-22","dueDate":null,"status":"pago","category":"Venda de Produto","paymentMethod":"pix","relatedSaleId":"SALE-1755883690891","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755883643768', '{"id":"FIN-1755883643768","type":"receita","description":"Venda de Produtos (PDV)","amount":115,"date":"2025-08-22","dueDate":null,"status":"pago","category":"Venda de Produto","paymentMethod":"pix","relatedSaleId":"SALE-1755883641155","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755721767702', '{"id":"FIN-1755721767702","type":"despesa","description":"Cartão mercado pago","amount":780,"date":"2025-08-20","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755717695994', '{"id":"FIN-1755717695994","type":"receita","description":"advocacia SINGH","amount":60,"date":"2025-08-20","dueDate":null,"status":null,"category":"Outra Receita","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755714453063-entry', '{"id":"FIN-1755714453063-entry","type":"receita","description":"Entrada OS #5342","amount":500,"date":"2025-08-20","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755714015342"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755714453064-1', '{"id":"FIN-1755714453064-1","type":"receita","description":"Parcela 2/3 OS #5342","amount":300,"date":"2025-08-20","dueDate":"2025-10-20","status":"pendente","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755714015342"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755714453064-2', '{"id":"FIN-1755714453064-2","type":"receita","description":"Parcela 3/3 OS #5342","amount":300,"date":"2025-08-20","dueDate":"2025-11-20","status":"pendente","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755714015342"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755713912198', '{"id":"FIN-1755713912198","type":"despesa","description":"Certidão ","amount":80,"date":"2025-08-20","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755713581398', '{"id":"FIN-1755713581398","type":"receita","description":"Pagamento integral OS #3765","amount":360,"date":"2025-08-20","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":"OS-1755635393765"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755537902350-0', '{"id":"FIN-1755537902350-0","type":"receita","description":"Parcela 1/1 - Venda #902335","amount":140,"date":"2025-08-20","dueDate":"2025-08-22","status":"pago","category":"Venda de Produto","paymentMethod":"parcelado","relatedSaleId":"SALE-1755537902335","relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755631714577', '{"id":"FIN-1755631714577","type":"despesa","description":"SOLDA","amount":18,"date":"2025-08-19","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755542038789', '{"id":"FIN-1755542038789","type":"despesa","description":"Etiquetas","amount":10,"date":"2025-08-18","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755536071750', '{"id":"FIN-1755536071750","type":"receita","description":"Colégio objetivo ","amount":1191.5,"date":"2025-08-18","dueDate":null,"status":null,"category":"Outra Receita","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755518079835', '{"id":"FIN-1755518079835","type":"receita","description":"Pagamento integral OS #0428","amount":360,"date":"2025-08-18","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755019840428"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755279473360', '{"id":"FIN-1755279473360","type":"despesa","description":"PAGAMENTO  CARTAO MELIUZ ","amount":1142.55,"date":"2025-08-15","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755279410472', '{"id":"FIN-1755279410472","type":"receita","description":"PAGAMENTO CLINICA SAO FRANCISCO ","amount":300,"date":"2025-08-15","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755279378105', '{"id":"FIN-1755279378105","type":"despesa","description":"PAGAMENTO FORNECEDOR ( INTERVIA INFORMÁTICA)","amount":2299.8,"date":"2025-08-15","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755267291351', '{"id":"FIN-1755267291351","type":"despesa","description":"COMPRA DE BOLACHA DOCE ","amount":6,"date":"2025-08-15","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Cartão de Crédito","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755267219550', '{"id":"FIN-1755267219550","type":"receita","description":"Pagamento integral OS #0241","amount":120,"date":"2025-08-15","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":"OS-1755000060241"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755267089222', '{"id":"FIN-1755267089222","type":"receita","description":"Pagamento integral OS #9857","amount":0,"date":"2025-08-15","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755104379857"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755267051614', '{"id":"FIN-1755267051614","type":"receita","description":"Pagamento integral OS #5950","amount":50,"date":"2025-08-15","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":"OS-1755109335950"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755193178505-entry', '{"id":"FIN-1755193178505-entry","type":"receita","description":"Entrada OS #2682","amount":475,"date":"2025-08-14","dueDate":null,"status":"pago","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"1753379126419-0.7429841024912682"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755193178505-0', '{"id":"FIN-1755193178505-0","type":"receita","description":"Parcela 1/1 OS #2682","amount":475,"date":"2025-08-14","dueDate":"2025-09-14","status":"pendente","category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"1753379126419-0.7429841024912682"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755191784673', '{"id":"FIN-1755191784673","type":"receita","description":"JÚLIA COLÉGIO OBJETIVO ","amount":60,"date":"2025-08-14","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755191725770', '{"id":"FIN-1755191725770","type":"receita","description":"ADVOCACIA BICHARA DOUTOR MOISÉS","amount":120,"date":"2025-08-14","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755111944477', '{"id":"FIN-1755111944477","type":"despesa","description":"Acerto márcio","amount":615,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755111297054', '{"id":"FIN-1755111297054","type":"receita","description":"Mensalidade Concrevale","amount":350,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Receita","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755104837080', '{"id":"FIN-1755104837080","type":"despesa","description":"Contador ","amount":120,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755104806600', '{"id":"FIN-1755104806600","type":"despesa","description":"Cartão Digio","amount":619.87,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755104739968', '{"id":"FIN-1755104739968","type":"despesa","description":"GASOLINA CARRO ","amount":154.9,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755104586792', '{"id":"FIN-1755104586792","type":"despesa","description":"Toner tinta","amount":800,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755104520121', '{"id":"FIN-1755104520121","type":"despesa","description":"Luz loja ","amount":106.19,"date":"2025-08-13","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"PIX","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755090879545', '{"id":"FIN-1755090879545","type":"receita","description":"Recebimento OS #2767","amount":3200,"date":"2025-08-13","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"1754069617587-0.9460596986242767"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755090860530', '{"id":"FIN-1755090860530","type":"receita","description":"Recebimento OS #9898","amount":320,"date":"2025-08-13","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"1754327946552-0.6291500893709898"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755028909921', '{"id":"FIN-1755028909921","type":"receita","description":"Recebimento OS #3457","amount":120,"date":"2025-08-12","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":"OS-1755027893457"}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755028453551', '{"id":"FIN-1755028453551","type":"receita","description":"ACERTO TRINDADE","amount":220,"date":"2025-08-12","dueDate":null,"status":null,"category":"Outra Receita","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755028405295', '{"id":"FIN-1755028405295","type":"despesa","description":"COMPRA DE BOLACHA E CAFÉ","amount":38.77,"date":"2025-08-12","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Cartão de Crédito","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755022337418', '{"id":"FIN-1755022337418","type":"receita","description":"ESCOLA IVAIPORÃ","amount":200,"date":"2025-08-12","dueDate":null,"status":null,"category":"Venda de Produto","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755022116546', '{"id":"FIN-1755022116546","type":"receita","description":"DR JOÃO RENATO ","amount":20,"date":"2025-08-12","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755022036858', '{"id":"FIN-1755022036858","type":"despesa","description":"INTERNET LOJA","amount":59.18,"date":"2025-08-12","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755021968283', '{"id":"FIN-1755021968283","type":"receita","description":"CHAMADO EDUARDO ADVOGADO","amount":40,"date":"2025-08-12","dueDate":null,"status":null,"category":"Venda de Serviço","paymentMethod":"Dinheiro","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('financialTransactions', 'FIN-1755021589348', '{"id":"FIN-1755021589348","type":"despesa","description":"GASOLINA CARRO ","amount":62,"date":"2025-08-12","dueDate":null,"status":null,"category":"Outra Despesa","paymentMethod":"Cartão de Crédito","relatedSaleId":null,"relatedServiceOrderId":null}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('users', 'USER-1755019021028', '{"id":"USER-1755019021028","name":"Wagner lopes","login":"wagner123","password":"amwwMDEyMTU=","permissions":{"accessDashboard":true,"accessClients":true,"accessServiceOrders":true,"accessInventory":true,"accessSales":true,"accessFinancials":true,"accessSettings":true,"accessDangerZone":true,"accessAgenda":true,"accessQuotes":true,"canEdit":true,"canDelete":true,"canViewPasswords":true,"canManageUsers":true,"accessLaudos":true}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('users', 'USER-1758283937999', '{"id":"USER-1758283937999","name":"João Pedro Boeno Lopes","login":"joao123","password":"amwwMDEyMTUxNg==","permissions":{"accessDashboard":true,"accessClients":true,"accessServiceOrders":true,"accessInventory":true,"accessSales":true,"accessFinancials":true,"accessSettings":true,"accessDangerZone":true,"accessAgenda":true,"accessQuotes":true,"canEdit":true,"canDelete":true,"canViewPasswords":true,"canManageUsers":true}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('users', 'USER-1758283959447', '{"id":"USER-1758283959447","name":"Ana Leticia Boeno Lopes ","login":"anaivp","password":"amwwMDEyMTU=","permissions":{"accessDashboard":true,"accessClients":true,"accessServiceOrders":true,"accessInventory":true,"accessSales":true,"accessFinancials":true,"accessSettings":true,"accessDangerZone":true,"accessAgenda":true,"accessQuotes":true,"canEdit":true,"canDelete":true,"canViewPasswords":true,"canManageUsers":true}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('appointments', 'APT-1755019197756', '{"id":"APT-1755019197756","title":"Escola ivaipoã.  - receber ","start":"2025-08-12","end":"","allDay":true,"extendedProps":{"customerId":"1753808271066-0.49650695169797754","customerName":"Escola ivaipoã. ","address":"Avenida Minas gerais","serviceType":"receber ","status":"concluido"}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('appointments', 'APT-1755019459499', '{"id":"APT-1755019459499","title":"ADVOCACIA JOÃO RENATO BITENCOURT - CHAMADO","start":"2025-08-12","end":"","allDay":true,"extendedProps":{"customerId":"CUST-1755019361820","customerName":"ADVOCACIA JOÃO RENATO BITENCOURT","address":"Avenida Minas gerais","serviceType":"CHAMADO","status":"concluido"}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('appointments', 'APT-1755023184898', '{"id":"APT-1755023184898","title":"ADVOCACIA LINCON - ENTREGAR COMPUTADOR","start":"2025-08-12","end":"","allDay":true,"extendedProps":{"customerId":"1753379075810-0.14090593043058108","customerName":"ADVOCACIA LINCON","address":"AVENIDA CASTELO BRANCO ","serviceType":"ENTREGAR COMPUTADOR","status":"concluido"}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('appointments', 'APT-1757513551348', '{"id":"APT-1757513551348","title":"ARMAZEM NATUREBA - buscar computador ","start":"2025-09-10T11:12","end":"2025-09-10T11:13","allDay":true,"extendedProps":{"status":"concluido","customerId":"1752525160400-0.21769594684339721","serviceType":"buscar computador ","customerName":"ARMAZEM NATUREBA","address":"AVENIDA BRASIL"}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('appointments', 'APT-1757944347625', '{"id":"APT-1757944347625","title":"CLIENTE AVULSO - Montar computador ","start":"2025-09-15","end":"","allDay":true,"extendedProps":{"customerId":"1752591100370-0.5475282037034886","customerName":"CLIENTE AVULSO","address":"RUA MARECHAL FLORIANO PEIXOTO, 80","serviceType":"Montar computador ","status":"concluido"}}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('quotes', 'QUOTE-1758222865502', '{"id":"QUOTE-1758222865502","date":"2025-09-18","time":"16:14:25","user":"Wagner lopes","subtotal":1690,"discount":0,"total":1690,"observations":"","customerId":"CUST-1758220211077","customerName":"TEREZA YOSHIE MAKITA ","status":"Pendente","validUntil":"2025-09-21","items":[{"id":"PROD-1758221309578","name":"PLACA MAE MSI A320","price":0,"quantity":1},{"id":"PROD-1758221224082","name":"PROCESSADOR ATHLON200GE","price":0,"quantity":1},{"id":"PROD-1758221262770","name":"MEMORIA 8 GB DDR 4 ","price":0,"quantity":1},{"id":"PROD-1755259240754","name":"SSD 240 GIGA WD","price":0,"quantity":1},{"id":"PROD-1758221372506","name":"HD 1 TERA WESTERN DIGITAL ","price":0,"quantity":1},{"id":"PROD-1758221405714","name":"GABINETE BASIC ","price":1690,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('quotes', 'QUOTE-1758221756673', '{"id":"QUOTE-1758221756673","date":"2025-09-18","time":"15:55:56","user":"Wagner lopes","subtotal":1690,"discount":0,"total":1690,"observations":"","customerId":"CUST-1758220211077","customerName":"TEREZA YOSHIE MAKITA ","status":"Vendido","validUntil":"2025-09-21","items":[{"id":"PROD-1758221309578","name":"PLACA MAE MSI A320","price":0,"quantity":1},{"id":"PROD-1758221224082","name":"PROCESSADOR ATHLON200GE","price":0,"quantity":1},{"id":"PROD-1758221262770","name":"MEMÓRIA 8 GB DDR 4 ","price":0,"quantity":1},{"id":"PROD-1755259240754","name":"SSD 240 GIGA WD","price":0,"quantity":1},{"id":"PROD-1758221372506","name":"HD 1 TERA WESTERN DIGITAL ","price":0,"quantity":1},{"id":"PROD-1758221405714","name":"GABINETE BASIC ","price":1690,"quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('kits', 'KIT-1758221518402', '{"id":"KIT-1758221518402","name":"COMPUTADOR ESCRITORIO ","items":[{"productId":"PROD-1758221309578","name":"PLACA MAE MSI A320","quantity":1},{"productId":"PROD-1758221224082","name":"PROCESSADOR ATHLON200GE","quantity":1},{"productId":"PROD-1758221262770","name":"MEMÓRIA 8 GB DDR 4 ","quantity":1},{"productId":"PROD-1755259240754","name":"SSD 240 GIGA WD","quantity":1},{"productId":"PROD-1758221372506","name":"HD 1 TERA WESTERN DIGITAL ","quantity":1},{"productId":"PROD-1758221405714","name":"GABINETE BASIC ","quantity":1}]}'::jsonb, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_singletons (collection, data, updated_at)
VALUES ('companyInfo', '{"id":1,"name":"JL INFORMÁTICA.","address":"Rua Santa Catarina 875","phone":"43996024065","emailOrSite":"jl.solucoes@hotmail.com","document":"14.130.359.0001-98","logoUrl":"data:image/jpeg;base64,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","pixKey":"14130359000198","notificationSoundUrl":null}'::jsonb, NOW())
ON CONFLICT (collection)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
INSERT INTO app_singletons (collection, data, updated_at)
VALUES ('settings', '{"defaultWarrantyDays":90}'::jsonb, NOW())
ON CONFLICT (collection)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
COMMIT;
