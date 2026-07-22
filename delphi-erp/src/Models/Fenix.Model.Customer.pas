unit Fenix.Model.Customer;

interface

uses
  Fenix.Model.Base;

type
  TCustomer = class(TEntityBase)
  private
    FFullName: string;
    FDocumentNumber: string;
    FPhone1: string;
    FWhatsapp: string;
    FEmail: string;
    FAddressLine: string;
    FCity: string;
    FStateCode: string;
    FNotes: string;
  public
    property FullName: string read FFullName write FFullName;
    property DocumentNumber: string read FDocumentNumber write FDocumentNumber;
    property Phone1: string read FPhone1 write FPhone1;
    property Whatsapp: string read FWhatsapp write FWhatsapp;
    property Email: string read FEmail write FEmail;
    property AddressLine: string read FAddressLine write FAddressLine;
    property City: string read FCity write FCity;
    property StateCode: string read FStateCode write FStateCode;
    property Notes: string read FNotes write FNotes;
  end;

implementation

end.
