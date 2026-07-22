unit Fenix.Model.ServiceOrder;

interface

uses
  Fenix.Model.Base;

type
  TServiceOrder = class(TEntityBase)
  private
    FNumberCode: Int64;
    FCustomerId: string;
    FStatusCode: Integer;
    FEquipmentDescription: string;
    FReportedIssue: string;
    FTechnicalDiagnosis: string;
    FFinalValue: Currency;
  public
    property NumberCode: Int64 read FNumberCode write FNumberCode;
    property CustomerId: string read FCustomerId write FCustomerId;
    property StatusCode: Integer read FStatusCode write FStatusCode;
    property EquipmentDescription: string read FEquipmentDescription write FEquipmentDescription;
    property ReportedIssue: string read FReportedIssue write FReportedIssue;
    property TechnicalDiagnosis: string read FTechnicalDiagnosis write FTechnicalDiagnosis;
    property FinalValue: Currency read FFinalValue write FFinalValue;
  end;

implementation

end.
