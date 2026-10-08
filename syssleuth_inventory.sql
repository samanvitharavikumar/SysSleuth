--
-- PostgreSQL database dump
--

\restrict fscuEJCpgykDg1o6fuzFWGws8CNwTMtaTgg1ojccQI4KHN3BOknGzYXgub63hmQ

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

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
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    product_id integer NOT NULL,
    name character varying(100) NOT NULL,
    stock integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url text
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: inventory_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_product_id_seq OWNER TO postgres;

--
-- Name: inventory_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_product_id_seq OWNED BY public.inventory.product_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    category character varying(50) NOT NULL,
    product_name text NOT NULL,
    product_url text,
    image_url text,
    rating numeric(3,2),
    rating_count text,
    price_inr numeric(12,2),
    original_price_inr numeric(12,2),
    discount text,
    offer text,
    source_timestamp timestamp without time zone
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: inventory product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN product_id SET DEFAULT nextval('public.inventory_product_id_seq'::regclass);


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (product_id, name, stock, updated_at, image_url) FROM stdin;
10	Air Jordan 3 Retro	99	2026-08-29 04:27:02.203212	https://www.newkick.org/image/cache/WORKING/DA3595-100/Air-Jordan-3-Retro-Fragment-DA3595-100-%282%29-2600x2600.jpg
8	Nike Blazer Mid '77	66	2026-08-29 04:27:02.203212	https://bexo.com.pe/cdn/shop/files/fb7eda3c-5ac8-4d05-a18f-1c2c5e82e36e.webp?v=1703179540&width=1728
9	Air Jordan 1 Low	98	2026-08-29 04:27:02.203212	https://nikeclprod.vtexassets.com/arquivos/ids/723382/DV0990_111_A_PREM.jpg?v=638241048832870000
2	Air Jordan 1 Retro High OG	1	2026-08-20 09:18:52.576965	https://static.nike.com/a/images/t_prod_ss/w_960%2Cc_limit%2Cf_auto/waqtpmrq5qbmdxm9avql/air-jordan-1-retro-high-og-white-black-release-date.jpg
3	Nike Dunk Low	0	2026-08-20 09:18:52.576965	https://www.moov.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw8015a01e/products/NIDD1391-100/NIDD1391-100-1.JPG
1	Nike Air Force 1 '07	2	2026-08-20 09:18:52.576965	https://limitededt.in/cdn/shop/files/CW2288-111_44e4808a-4085-47cf-b8bb-85ad541f1881.jpg?v=1757161154&width=2048
4	Air Jordan 4 Retro	100	2026-08-29 04:27:02.203212	https://www.buzzsneakers.rs/files/thumbs/files/images/2022/6/18/thumbs_900/293328_900_900px.png
5	Nike Air Max 1	100	2026-08-29 04:27:02.203212	https://www.nike.sa/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dwc36f8d1f/nk/6cf/7/5/7/9/0/6cf75790_13d6_48c7_bef5_44c8039f36d6.png?sh=2000&sm=fit&sw=2000
6	Nike Air Max 90	100	2026-08-29 04:27:02.203212	https://static.nike.com/a/images/t_default/u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d%2Cc_scale%2Cfl_relative%2Cw_1.0%2Ch_1.0%2Cfl_layer_apply/f49161f1-cec9-4ee5-b9e5-1dd6a4b1b974/NIKE%2BAIR%2BMAX%2B90.png
7	Nike Air Max 95	100	2026-08-29 04:27:02.203212	https://cms-cdn.thesolesupplier.co.uk/2017/09/Nike-Air-Max-95-White-Black_w672_h672_pad_.png.webp
11	Air Jordan 11 Retro	100	2026-08-29 04:27:02.203212	https://toyzone.ph/wp-content/uploads/2025/01/11-3-4.png
12	Nike SB Dunk Low	100	2026-08-29 04:27:02.203212	https://www.laplazaskateshop.com/cdn/shop/files/AURORA_CD2563-101_PHSRH000-2000.jpg?v=1717748618&width=2000
13	Nike Cortez	100	2026-08-29 04:27:02.203212	https://www.capital.com.ph/cdn/shop/files/DM4044-105_0929853c-c0e4-4a16-a7c7-c30fdbe150a2.jpg?v=1720666155
14	Nike Air Huarache	100	2026-08-29 04:27:02.203212	https://www.nike.sa/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dw14a504bc/nk/700/5/f/5/c/c/7005f5cc_1215_41b0_bf81_0ccdadb99947.jpg
15	Air Jordan 6 Retro	100	2026-08-29 04:27:02.203212	https://kicktheory.com/cdn/shop/files/AURORA_CT8529-112_PHCFH001-2000.jpg?v=1717857204
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, category, product_name, product_url, image_url, rating, rating_count, price_inr, original_price_inr, discount, offer, source_timestamp) FROM stdin;
2	Sneakers	Nike Dunk Low	https://sneakersclinic.com/products/nike-dunk-low-black-white-panda-dd1391-100	https://sneakersclinic.com/cdn/shop/products/DD1391-100_01_ec1061a1-ecde-44f1-93e4-9da84506eb06.jpg?v=1624094152	4.40	(1,36,034)	8295.00	9995.00	17% off	Bank Offer	2025-07-21 19:23:12
3	Sneakers	Nike Air Max 1	https://thedropdate.com/releases/nike-air-max-1-og-university-red-908375-103	https://d2sw2hhlzkf9db.cloudfront.net/uploads/2017/02/Nike-Air-Max-1-Anniversary-Red-feat.jpg	4.00	(6,637)	9995.00	11995.00	17% off	Bank Offer	2025-07-21 19:23:12
4	Sneakers	Nike Air Max 90	https://www.nike.qa/en/air-max-90-mens-shoe/NKCN8490-100.html	https://www.nike.qa/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dwf77be035/nk/b72/e/d/1/4/d/b72ed14d_f0e6_4f26_89bc_5cf567f874ae.png	4.10	(3,65,586)	9995.00	11995.00	17% off	Hot Deal	2025-07-21 19:23:12
5	Sneakers	Nike Air Max 270	https://www.nike.com/t/air-max-270-mens-shoes-KkLcGR	https://static.nike.com/a/images/t_PDP_1728_v1/f_auto%2Cq_auto%3Aeco/sdxif37re9xkdk2d7q0o/AIR%2BMAX%2B270.png	4.20	(6,35,574)	11495.00	13495.00	15% off	Bank Offer	2025-07-21 19:23:12
6	Sneakers	Nike Air Max 97	https://kream.co.kr/products/17528	https://www.nike.com.pe/on/demandware.static/-/Sites-catalog-equinox/default/dw5aa9bf9c/images/hi-res/196975692019_3_20240327-mrtPeru.jpg	4.10	(3,65,586)	9495.00	11495.00	17% off	Lowest price since launch	2025-07-21 19:23:13
7	Sneakers	Nike Blazer Mid '77	https://www.nike.qa/en/blazer-mid-77-vintage-mens-shoes/NKBQ6806-100.html	https://www.nike.qa/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dw0768d748/nk/389/b/7/0/9/e/389b709e_5102_4e55_aa5d_07099b500831.jpg	4.00	(30,604)	8495.00	9995.00	15% off	Bank Offer	2025-07-21 19:23:13
8	Sneakers	Nike Cortez	https://www.capital.com.ph/products/dm4044-105	https://www.capital.com.ph/cdn/shop/files/DM4044-105_0929853c-c0e4-4a16-a7c7-c30fdbe150a2.jpg?v=1720666155	4.20	(4,26,470)	8995.00	10995.00	18% off	Bank Offer	2025-07-21 19:23:13
9	Sneakers	Nike Air Huarache	https://www.kickscrew.com/products/nike-air-huarache-triple-white-dd1068-102	https://cdn.shopify.com/s/files/1/0603/3031/1875/files/2_36bd4f81-cbbd-4f71-9e33-108e5edc4be6.jpg?v=1708687374	4.00	(1,78,679)	9495.00	11495.00	17% off	Bank Offer	2025-07-21 19:23:13
10	Sneakers	Air Jordan 1 Retro High	https://www.toronto.com.ar/productos/zapatillas-nike-jordan-1-retro-high-og-chicago/	https://acdn-us.mitiendanube.com/stores/002/446/592/products/jordan-clasica-lado-f65bb6906b1e14fc9017240726870994-640-0.webp	4.10	(1,12,346)	14995.00	16995.00	12% off	Only 1 left	2025-07-21 19:23:13
11	Sneakers	Air Jordan 1 Low	https://www.kickscrew.com/products/air-jordan-1-low-bred-553558-067	https://cdn.shopify.com/s/files/1/0603/3031/1875/files/main-square_f50903d2-ce39-4518-a4e4-2576beea28e9.jpg?v=1772201864	4.20	(5,87,328)	9495.00	11995.00	21% off	Bank Offer	2025-07-21 19:23:14
15	Sneakers	Air Jordan 6 Retro	https://www.kickscrew.com/products/air-jordan-6-retro-carmine-384664-160	https://cdn.shopify.com/s/files/1/0603/3031/1875/files/main-square_daff334d-5629-40ff-900b-388eccae9972_384x.jpg?=75&v=1708487301	4.40	(1,36,034)	14995.00	16995.00	12% off	Hot Deal	2025-07-21 19:23:14
12	Sneakers	Air Jordan 4 Retro	https://hbx.com/jp/men/brands/jordan-brand/air-jordan-4-retro-white-cement-4-summit-white-fire-red-cement	https://image-cdn.hypb.st/https%3A%2F%2Fs3.store.hypebeast.com%2Fmedia%2Fimage%2Faf%2F13%2FShoes-1-1-a04c8.jpg?fit=max&q=90&w=1080	3.60	(227)	16995.00	18995.00	11% off	Only few left	2025-07-21 19:23:14
13	Sneakers	Air Jordan 11 Retro	https://grailify.com/de/sneaker/air-jordan-11-concord	https://grailify.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MjgxOTkyLCJwdXIiOiJibG9iX2lkIn19--f6125ac6b7c8a753f2bd961099f788c080ab0127/Image%202	4.30	(5,47,688)	19995.00	21995.00	9% off	Bank Offer	2025-07-21 19:23:14
14	Sneakers	Nike SB Dunk Low	https://venueskateboards.com/products/nike-sb-dunk-low-black-white-black-gum	https://venueskateboards.com/cdn/shop/files/AURORA_HF3704-003_PHSLH000-2000_clipped_rev_1_2048x.jpg?v=1737402535	3.80	(948)	9695.00	10995.00	12% off	Bank Offer	2025-07-21 19:23:14
1	Sneakers	Nike Air Force 1 '07	https://limitededt.in/products/nike-air-force-1-07-triple-white-cw2288-111	https://limitededt.in/cdn/shop/files/CW2288-111_44e4808a-4085-47cf-b8bb-85ad541f1881.jpg?v=1757161154&width=2048	3.80	(32,346)	9995.00	10995.00	9% off	Bank Offer	2025-07-21 19:23:11
\.


--
-- Name: inventory_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_product_id_seq', 1, false);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (product_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- PostgreSQL database dump complete
--

\unrestrict fscuEJCpgykDg1o6fuzFWGws8CNwTMtaTgg1ojccQI4KHN3BOknGzYXgub63hmQ