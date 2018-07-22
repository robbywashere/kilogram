--
-- PostgreSQL database dump
--

-- Dumped from database version 10.4
-- Dumped by pg_dump version 10.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_DownloadIGAvaJobs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_DownloadIGAvaJobs_status" AS ENUM (
    'OPEN',
    'SPINNING',
    'SUCCESS',
    'SLEEPING',
    'FAILED'
);


ALTER TYPE public."enum_DownloadIGAvaJobs_status" OWNER TO postgres;

--
-- Name: enum_IGAccounts_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_IGAccounts_status" AS ENUM (
    'UNVERIFIED',
    'GOOD',
    'FAILED'
);


ALTER TYPE public."enum_IGAccounts_status" OWNER TO postgres;

--
-- Name: enum_Photos_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Photos_status" AS ENUM (
    'UNKNOWN',
    'UPLOADED',
    'DELETED'
);


ALTER TYPE public."enum_Photos_status" OWNER TO postgres;

--
-- Name: enum_Photos_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Photos_type" AS ENUM (
    'POST',
    'IGAVATAR'
);


ALTER TYPE public."enum_Photos_type" OWNER TO postgres;

--
-- Name: enum_PostJobs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PostJobs_status" AS ENUM (
    'OPEN',
    'SPINNING',
    'SUCCESS',
    'SLEEPING',
    'FAILED'
);


ALTER TYPE public."enum_PostJobs_status" OWNER TO postgres;

--
-- Name: enum_Posts_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Posts_status" AS ENUM (
    'DRAFT',
    'PUBLISH',
    'PUBLISHED',
    'FAILED'
);


ALTER TYPE public."enum_Posts_status" OWNER TO postgres;

--
-- Name: enum_SendEmailJobs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_SendEmailJobs_status" AS ENUM (
    'OPEN',
    'SPINNING',
    'SUCCESS',
    'SLEEPING',
    'FAILED'
);


ALTER TYPE public."enum_SendEmailJobs_status" OWNER TO postgres;

--
-- Name: enum_UserAccounts_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_UserAccounts_role" AS ENUM (
    'member',
    'admin'
);


ALTER TYPE public."enum_UserAccounts_role" OWNER TO postgres;

--
-- Name: enum_VerifyIGJobs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_VerifyIGJobs_status" AS ENUM (
    'OPEN',
    'SPINNING',
    'SUCCESS',
    'SLEEPING',
    'FAILED'
);


ALTER TYPE public."enum_VerifyIGJobs_status" OWNER TO postgres;

--
-- Name: t__postjobs_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.t__postjobs_notifications() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE 
  body json;
  row_data json;
  meta json;
  BEGIN

    body = json_build_object('data',json_build_object('PostJob',json_build_object('PostId', NEW."PostId",'AccountId', NEW."AccountId",'IGAccountId', NEW."IGAccountId",'status', NEW."status",'id', NEW."id")), 'meta','{"type":"PostJob:status","resource":"PostJob"}'::json);

    INSERT INTO "Notifications" ("createdAt","updatedAt",body,"AccountId")

    VALUES (NOW(),NOW(),body,NEW."AccountId");

  RETURN NEW;

END;
$$;


ALTER FUNCTION public.t__postjobs_notifications() OWNER TO postgres;

--
-- Name: trigger_notify_event(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_notify_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE 
        data json;
        notification json;
        event_name TEXT;
    BEGIN
        event_name = TG_ARGV[0];
        -- Convert the old or new row to JSON, based on the kind of action.
        -- Action = DELETE?             -> OLD row
        -- Action = INSERT or UPDATE?   -> NEW row
        IF (TG_OP = 'DELETE') THEN
            data = row_to_json(OLD);
        ELSE
            data = row_to_json(NEW);
        END IF;
        
        -- Contruct the notification as a JSON string.
        notification = json_build_object(
                          'event_name', event_name,
                          'table', TG_TABLE_NAME,
                          'action', TG_OP,
                          'data', data);
        -- Execute pg_notify(channel, notification)
        PERFORM pg_notify(event_name, notification::text);
        -- Result is ignored since this is an AFTER trigger
        RETURN NULL; 
    END;
$$;


ALTER FUNCTION public.trigger_notify_event() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Accounts" (
    id integer NOT NULL,
    name character varying(255),
    enabled boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Accounts" OWNER TO postgres;

--
-- Name: Accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Accounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Accounts_id_seq" OWNER TO postgres;

--
-- Name: Accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Accounts_id_seq" OWNED BY public."Accounts".id;


--
-- Name: Devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Devices" (
    id integer NOT NULL,
    online boolean NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    idle boolean NOT NULL,
    "adbId" character varying(255) NOT NULL,
    "nodeName" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Devices" OWNER TO postgres;

--
-- Name: Devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Devices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Devices_id_seq" OWNER TO postgres;

--
-- Name: Devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Devices_id_seq" OWNED BY public."Devices".id;


--
-- Name: DownloadIGAvaJobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DownloadIGAvaJobs" (
    id integer NOT NULL,
    body json,
    data json,
    attempts integer DEFAULT 0,
    status public."enum_DownloadIGAvaJobs_status" DEFAULT 'OPEN'::public."enum_DownloadIGAvaJobs_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "IGAccountId" integer NOT NULL
);


ALTER TABLE public."DownloadIGAvaJobs" OWNER TO postgres;

--
-- Name: DownloadIGAvaJobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DownloadIGAvaJobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."DownloadIGAvaJobs_id_seq" OWNER TO postgres;

--
-- Name: DownloadIGAvaJobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DownloadIGAvaJobs_id_seq" OWNED BY public."DownloadIGAvaJobs".id;


--
-- Name: IGAccounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IGAccounts" (
    id integer NOT NULL,
    password character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    status public."enum_IGAccounts_status" DEFAULT 'UNVERIFIED'::public."enum_IGAccounts_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "AccountId" integer NOT NULL,
    "avatarUUID" uuid
);


ALTER TABLE public."IGAccounts" OWNER TO postgres;

--
-- Name: IGAccounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."IGAccounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."IGAccounts_id_seq" OWNER TO postgres;

--
-- Name: IGAccounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."IGAccounts_id_seq" OWNED BY public."IGAccounts".id;


--
-- Name: NotificationReads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationReads" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "NotificationId" integer,
    "UserId" integer NOT NULL
);


ALTER TABLE public."NotificationReads" OWNER TO postgres;

--
-- Name: NotificationReads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."NotificationReads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."NotificationReads_id_seq" OWNER TO postgres;

--
-- Name: NotificationReads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."NotificationReads_id_seq" OWNED BY public."NotificationReads".id;


--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notifications" (
    id integer NOT NULL,
    body json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "AccountId" integer NOT NULL
);


ALTER TABLE public."Notifications" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Notifications_id_seq" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Notifications_id_seq" OWNED BY public."Notifications".id;


--
-- Name: Photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Photos" (
    id integer NOT NULL,
    "objectName" text,
    uuid uuid,
    meta json,
    src character varying(255),
    type public."enum_Photos_type" NOT NULL,
    bucket character varying(255) DEFAULT 'uploads'::character varying,
    status public."enum_Photos_status" DEFAULT 'UNKNOWN'::public."enum_Photos_status",
    url text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "AccountId" integer
);


ALTER TABLE public."Photos" OWNER TO postgres;

--
-- Name: Photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Photos_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Photos_id_seq" OWNER TO postgres;

--
-- Name: Photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Photos_id_seq" OWNED BY public."Photos".id;


--
-- Name: PostJobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PostJobs" (
    id integer NOT NULL,
    body json,
    data json,
    attempts integer DEFAULT 0,
    status public."enum_PostJobs_status" DEFAULT 'OPEN'::public."enum_PostJobs_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "PostId" integer,
    "AccountId" integer NOT NULL,
    "IGAccountId" integer NOT NULL
);


ALTER TABLE public."PostJobs" OWNER TO postgres;

--
-- Name: PostJobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PostJobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PostJobs_id_seq" OWNER TO postgres;

--
-- Name: PostJobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PostJobs_id_seq" OWNED BY public."PostJobs".id;


--
-- Name: Posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Posts" (
    id integer NOT NULL,
    text text,
    "postDate" timestamp with time zone NOT NULL,
    status public."enum_Posts_status" DEFAULT 'PUBLISH'::public."enum_Posts_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "AccountId" integer NOT NULL,
    "IGAccountId" integer NOT NULL,
    "photoUUID" uuid
);


ALTER TABLE public."Posts" OWNER TO postgres;

--
-- Name: Posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Posts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Posts_id_seq" OWNER TO postgres;

--
-- Name: Posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Posts_id_seq" OWNED BY public."Posts".id;


--
-- Name: SendEmailJobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SendEmailJobs" (
    id integer NOT NULL,
    body json,
    data json,
    attempts integer DEFAULT 0,
    status public."enum_SendEmailJobs_status" DEFAULT 'OPEN'::public."enum_SendEmailJobs_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."SendEmailJobs" OWNER TO postgres;

--
-- Name: SendEmailJobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SendEmailJobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SendEmailJobs_id_seq" OWNER TO postgres;

--
-- Name: SendEmailJobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SendEmailJobs_id_seq" OWNED BY public."SendEmailJobs".id;


--
-- Name: UserAccounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserAccounts" (
    role public."enum_UserAccounts_role" DEFAULT 'member'::public."enum_UserAccounts_role" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "AccountId" integer NOT NULL,
    "UserId" integer NOT NULL
);


ALTER TABLE public."UserAccounts" OWNER TO postgres;

--
-- Name: UserInvites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserInvites" (
    id integer NOT NULL,
    key character varying(255),
    email character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "UserId" integer,
    "AccountId" integer NOT NULL
);


ALTER TABLE public."UserInvites" OWNER TO postgres;

--
-- Name: UserInvites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserInvites_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UserInvites_id_seq" OWNER TO postgres;

--
-- Name: UserInvites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserInvites_id_seq" OWNED BY public."UserInvites".id;


--
-- Name: UserSignups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSignups" (
    id integer NOT NULL,
    key character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "UserId" integer
);


ALTER TABLE public."UserSignups" OWNER TO postgres;

--
-- Name: UserSignups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserSignups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UserSignups_id_seq" OWNER TO postgres;

--
-- Name: UserSignups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserSignups_id_seq" OWNED BY public."UserSignups".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    "verifyKey" character varying(255),
    "passwordKey" character varying(255),
    "refreshToken" character varying(255),
    verified boolean DEFAULT true,
    password character varying(255),
    "superAdmin" boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: VerifyIGJobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerifyIGJobs" (
    id integer NOT NULL,
    body json,
    data json,
    attempts integer DEFAULT 0,
    status public."enum_VerifyIGJobs_status" DEFAULT 'OPEN'::public."enum_VerifyIGJobs_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "IGAccountId" integer NOT NULL
);


ALTER TABLE public."VerifyIGJobs" OWNER TO postgres;

--
-- Name: VerifyIGJobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."VerifyIGJobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."VerifyIGJobs_id_seq" OWNER TO postgres;

--
-- Name: VerifyIGJobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."VerifyIGJobs_id_seq" OWNED BY public."VerifyIGJobs".id;


--
-- Name: bucketevents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bucketevents (
    id integer NOT NULL,
    key character varying(255),
    value json,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bucketevents OWNER TO postgres;

--
-- Name: bucketevents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bucketevents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bucketevents_id_seq OWNER TO postgres;

--
-- Name: bucketevents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bucketevents_id_seq OWNED BY public.bucketevents.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: Accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Accounts" ALTER COLUMN id SET DEFAULT nextval('public."Accounts_id_seq"'::regclass);


--
-- Name: Devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Devices" ALTER COLUMN id SET DEFAULT nextval('public."Devices_id_seq"'::regclass);


--
-- Name: DownloadIGAvaJobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DownloadIGAvaJobs" ALTER COLUMN id SET DEFAULT nextval('public."DownloadIGAvaJobs_id_seq"'::regclass);


--
-- Name: IGAccounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IGAccounts" ALTER COLUMN id SET DEFAULT nextval('public."IGAccounts_id_seq"'::regclass);


--
-- Name: NotificationReads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationReads" ALTER COLUMN id SET DEFAULT nextval('public."NotificationReads_id_seq"'::regclass);


--
-- Name: Notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications" ALTER COLUMN id SET DEFAULT nextval('public."Notifications_id_seq"'::regclass);


--
-- Name: Photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos" ALTER COLUMN id SET DEFAULT nextval('public."Photos_id_seq"'::regclass);


--
-- Name: PostJobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostJobs" ALTER COLUMN id SET DEFAULT nextval('public."PostJobs_id_seq"'::regclass);


--
-- Name: Posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Posts" ALTER COLUMN id SET DEFAULT nextval('public."Posts_id_seq"'::regclass);


--
-- Name: SendEmailJobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SendEmailJobs" ALTER COLUMN id SET DEFAULT nextval('public."SendEmailJobs_id_seq"'::regclass);


--
-- Name: UserInvites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserInvites" ALTER COLUMN id SET DEFAULT nextval('public."UserInvites_id_seq"'::regclass);


--
-- Name: UserSignups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSignups" ALTER COLUMN id SET DEFAULT nextval('public."UserSignups_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: VerifyIGJobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerifyIGJobs" ALTER COLUMN id SET DEFAULT nextval('public."VerifyIGJobs_id_seq"'::regclass);


--
-- Name: bucketevents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucketevents ALTER COLUMN id SET DEFAULT nextval('public.bucketevents_id_seq'::regclass);


--
-- Name: Accounts Accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Accounts"
    ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY (id);


--
-- Name: Devices Devices_adbId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Devices"
    ADD CONSTRAINT "Devices_adbId_key" UNIQUE ("adbId");


--
-- Name: Devices Devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Devices"
    ADD CONSTRAINT "Devices_pkey" PRIMARY KEY (id);


--
-- Name: DownloadIGAvaJobs DownloadIGAvaJobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DownloadIGAvaJobs"
    ADD CONSTRAINT "DownloadIGAvaJobs_pkey" PRIMARY KEY (id);


--
-- Name: IGAccounts IGAccounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IGAccounts"
    ADD CONSTRAINT "IGAccounts_pkey" PRIMARY KEY (id);


--
-- Name: IGAccounts IGAccounts_username_AccountId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IGAccounts"
    ADD CONSTRAINT "IGAccounts_username_AccountId_key" UNIQUE (username, "AccountId");


--
-- Name: NotificationReads NotificationReads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationReads"
    ADD CONSTRAINT "NotificationReads_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Photos Photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_pkey" PRIMARY KEY (id);


--
-- Name: Photos Photos_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_uuid_key" UNIQUE (uuid);


--
-- Name: PostJobs PostJobs_PostId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostJobs"
    ADD CONSTRAINT "PostJobs_PostId_key" UNIQUE ("PostId");


--
-- Name: PostJobs PostJobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostJobs"
    ADD CONSTRAINT "PostJobs_pkey" PRIMARY KEY (id);


--
-- Name: Posts Posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Posts"
    ADD CONSTRAINT "Posts_pkey" PRIMARY KEY (id);


--
-- Name: SendEmailJobs SendEmailJobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SendEmailJobs"
    ADD CONSTRAINT "SendEmailJobs_pkey" PRIMARY KEY (id);


--
-- Name: UserAccounts UserAccounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserAccounts"
    ADD CONSTRAINT "UserAccounts_pkey" PRIMARY KEY ("AccountId", "UserId");


--
-- Name: UserInvites UserInvites_email_AccountId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserInvites"
    ADD CONSTRAINT "UserInvites_email_AccountId_key" UNIQUE (email, "AccountId");


--
-- Name: UserInvites UserInvites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserInvites"
    ADD CONSTRAINT "UserInvites_pkey" PRIMARY KEY (id);


--
-- Name: UserSignups UserSignups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSignups"
    ADD CONSTRAINT "UserSignups_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: VerifyIGJobs VerifyIGJobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerifyIGJobs"
    ADD CONSTRAINT "VerifyIGJobs_pkey" PRIMARY KEY (id);


--
-- Name: bucketevents bucketevents_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucketevents
    ADD CONSTRAINT bucketevents_key_key UNIQUE (key);


--
-- Name: bucketevents bucketevents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucketevents
    ADD CONSTRAINT bucketevents_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: bucketevents bucketevents:after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "bucketevents:after_insert" AFTER INSERT ON public.bucketevents FOR EACH ROW EXECUTE PROCEDURE public.trigger_notify_event('bucketevents:after_insert');


--
-- Name: IGAccounts ig_accounts:after_update:status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "ig_accounts:after_update:status" AFTER UPDATE OF status ON public."IGAccounts" FOR EACH ROW EXECUTE PROCEDURE public.trigger_notify_event('ig_accounts:after_update:status');


--
-- Name: Notifications notifications:after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "notifications:after_insert" AFTER INSERT ON public."Notifications" FOR EACH ROW EXECUTE PROCEDURE public.trigger_notify_event('notifications:after_insert');


--
-- Name: Photos photos:after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "photos:after_insert" AFTER INSERT ON public."Photos" FOR EACH ROW EXECUTE PROCEDURE public.trigger_notify_event('photos:after_insert');


--
-- Name: PostJobs t__postjobs_notifications; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER t__postjobs_notifications AFTER UPDATE OF status ON public."PostJobs" FOR EACH ROW EXECUTE PROCEDURE public.t__postjobs_notifications();


--
-- Name: DownloadIGAvaJobs DownloadIGAvaJobs_IGAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DownloadIGAvaJobs"
    ADD CONSTRAINT "DownloadIGAvaJobs_IGAccountId_fkey" FOREIGN KEY ("IGAccountId") REFERENCES public."IGAccounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IGAccounts IGAccounts_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IGAccounts"
    ADD CONSTRAINT "IGAccounts_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IGAccounts IGAccounts_avatarUUID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IGAccounts"
    ADD CONSTRAINT "IGAccounts_avatarUUID_fkey" FOREIGN KEY ("avatarUUID") REFERENCES public."Photos"(uuid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationReads NotificationReads_NotificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationReads"
    ADD CONSTRAINT "NotificationReads_NotificationId_fkey" FOREIGN KEY ("NotificationId") REFERENCES public."Notifications"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationReads NotificationReads_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationReads"
    ADD CONSTRAINT "NotificationReads_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE;


--
-- Name: Notifications Notifications_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Photos Photos_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PostJobs PostJobs_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostJobs"
    ADD CONSTRAINT "PostJobs_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PostJobs PostJobs_IGAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostJobs"
    ADD CONSTRAINT "PostJobs_IGAccountId_fkey" FOREIGN KEY ("IGAccountId") REFERENCES public."IGAccounts"(id) ON UPDATE CASCADE;


--
-- Name: PostJobs PostJobs_PostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostJobs"
    ADD CONSTRAINT "PostJobs_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES public."Posts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Posts Posts_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Posts"
    ADD CONSTRAINT "Posts_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Posts Posts_IGAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Posts"
    ADD CONSTRAINT "Posts_IGAccountId_fkey" FOREIGN KEY ("IGAccountId") REFERENCES public."IGAccounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Posts Posts_photoUUID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Posts"
    ADD CONSTRAINT "Posts_photoUUID_fkey" FOREIGN KEY ("photoUUID") REFERENCES public."Photos"(uuid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserAccounts UserAccounts_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserAccounts"
    ADD CONSTRAINT "UserAccounts_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserAccounts UserAccounts_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserAccounts"
    ADD CONSTRAINT "UserAccounts_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserInvites UserInvites_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserInvites"
    ADD CONSTRAINT "UserInvites_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE;


--
-- Name: UserInvites UserInvites_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserInvites"
    ADD CONSTRAINT "UserInvites_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserSignups UserSignups_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSignups"
    ADD CONSTRAINT "UserSignups_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VerifyIGJobs VerifyIGJobs_IGAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerifyIGJobs"
    ADD CONSTRAINT "VerifyIGJobs_IGAccountId_fkey" FOREIGN KEY ("IGAccountId") REFERENCES public."IGAccounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


CREATE OR REPLACE FUNCTION public.t__postjobs_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE 
  body json;
  row_data json;
  meta json;
  BEGIN

    body = json_build_object('data',json_build_object('PostJob',json_build_object('PostId', NEW."PostId",'AccountId', NEW."AccountId",'IGAccountId', NEW."IGAccountId",'status', NEW."status",'id', NEW."id")), 'meta','{"type":"PostJob:status","resource":"PostJob"}'::json);

    INSERT INTO "Notifications" ("createdAt","updatedAt",body,"AccountId")

    VALUES (NOW(),NOW(),body,NEW."AccountId");

  RETURN NEW;

END;
$function$
;
CREATE OR REPLACE FUNCTION public.trigger_notify_event()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE 
        data json;
        notification json;
        event_name TEXT;
    BEGIN
        event_name = TG_ARGV[0];
        -- Convert the old or new row to JSON, based on the kind of action.
        -- Action = DELETE?             -> OLD row
        -- Action = INSERT or UPDATE?   -> NEW row
        IF (TG_OP = 'DELETE') THEN
            data = row_to_json(OLD);
        ELSE
            data = row_to_json(NEW);
        END IF;
        
        -- Contruct the notification as a JSON string.
        notification = json_build_object(
                          'event_name', event_name,
                          'table', TG_TABLE_NAME,
                          'action', TG_OP,
                          'data', data);
        -- Execute pg_notify(channel, notification)
        PERFORM pg_notify(event_name, notification::text);
        -- Result is ignored since this is an AFTER trigger
        RETURN NULL; 
    END;
$function$
;