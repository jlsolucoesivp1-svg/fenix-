unit Fenix.DM.Connection;

interface

uses
  System.SysUtils,
  System.Classes,
  FireDAC.Comp.Client,
  FireDAC.Phys.PG,
  FireDAC.Phys.PGDef,
  FireDAC.Stan.Def,
  FireDAC.Stan.Async,
  FireDAC.Stan.Option,
  FireDAC.UI.Intf,
  FireDAC.VCLUI.Wait,
  Fenix.Config.App;

type
  TDMConnection = class(TDataModule)
    FDConnection: TFDConnection;
    FDPhysPgDriverLink: TFDPhysPgDriverLink;
    FDGUIxWaitCursor: TFDGUIxWaitCursor;
  private
    FSettings: TAppSettings;
  public
    destructor Destroy; override;
    procedure Configure(const ASettingsFile: string);
    procedure Connect;
    property Settings: TAppSettings read FSettings;
  end;

var
  DMConnection: TDMConnection;

implementation

{%CLASSGROUP 'Vcl.Controls.TControl'}

{$R *.dfm}

destructor TDMConnection.Destroy;
begin
  FSettings.Free;
  inherited;
end;

procedure TDMConnection.Configure(const ASettingsFile: string);
begin
  FreeAndNil(FSettings);
  FSettings := TAppSettings.LoadFromFile(ASettingsFile);

  FDConnection.Params.Clear;
  FDConnection.Params.DriverID := 'PG';
  FDConnection.Params.Add('Server=' + FSettings.Database.Server);
  FDConnection.Params.Add('Port=' + FSettings.Database.Port.ToString);
  FDConnection.Params.Add('Database=' + FSettings.Database.Database);
  FDConnection.Params.Add('User_Name=' + FSettings.Database.UserName);
  FDConnection.Params.Add('Password=' + FSettings.Database.Password);
  FDConnection.LoginPrompt := False;
end;

procedure TDMConnection.Connect;
begin
  if not FDConnection.Connected then
    FDConnection.Connected := True;
end;

end.
