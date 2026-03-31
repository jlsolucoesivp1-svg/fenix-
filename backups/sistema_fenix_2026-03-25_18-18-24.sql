--
-- PostgreSQL database dump
--

\restrict A1YLE67Q5asaKIOFzcM58EsyoiHhBLdH1hcn0GhudWP5WyjWzLppEOO20MqbuD2

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_records (
    collection text NOT NULL,
    record_id text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_records OWNER TO postgres;

--
-- Name: app_singletons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_singletons (
    collection text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_singletons OWNER TO postgres;

--
-- Data for Name: app_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_records (collection, record_id, data, updated_at) FROM stdin;
users	USER-1774471046668	{"id": "USER-1774471046668", "name": "Admin Docker", "login": "admin", "password": "MTIzNDU2", "permissions": {"canEdit": true, "canDelete": true, "accessSales": true, "accessAgenda": true, "accessLaudos": true, "accessQuotes": true, "accessClients": true, "accessSettings": true, "canManageUsers": true, "accessDashboard": true, "accessInventory": true, "accessDangerZone": true, "accessFinancials": true, "canViewPasswords": true, "accessServiceOrders": true}}	2026-03-25 20:55:29.948233+00
users	USER-1774472129927	{"id": "USER-1774472129927", "name": "wagner lopes ", "login": "wagnerivp", "password": "amwwMDEyMTU=", "permissions": {"canEdit": true, "canDelete": true, "accessSales": true, "accessAgenda": true, "accessLaudos": true, "accessQuotes": true, "accessClients": true, "accessSettings": true, "canManageUsers": true, "accessDashboard": true, "accessInventory": true, "accessDangerZone": true, "accessFinancials": true, "canViewPasswords": true, "accessServiceOrders": true}}	2026-03-25 20:55:29.948233+00
\.


--
-- Data for Name: app_singletons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_singletons (collection, data, updated_at) FROM stdin;
settings	{"id": 1, "defaultWarrantyDays": 90}	2026-03-25 20:54:33.844453+00
\.


--
-- Name: app_records app_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_records
    ADD CONSTRAINT app_records_pkey PRIMARY KEY (collection, record_id);


--
-- Name: app_singletons app_singletons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_singletons
    ADD CONSTRAINT app_singletons_pkey PRIMARY KEY (collection);


--
-- Name: idx_app_records_users_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_app_records_users_login ON public.app_records USING btree (((data ->> 'login'::text))) WHERE (collection = 'users'::text);


--
-- PostgreSQL database dump complete
--

\unrestrict A1YLE67Q5asaKIOFzcM58EsyoiHhBLdH1hcn0GhudWP5WyjWzLppEOO20MqbuD2

