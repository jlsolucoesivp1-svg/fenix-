unit Fenix.Config.App;

interface

uses
  System.SysUtils,
  System.Classes,
  System.IOUtils,
  System.JSON,
  Fenix.Config.Database;

type
  TSecuritySettings = record
    Pepper: string;
    SessionMinutes: Integer;
  end;

  TAppSettings = class
  private
    FApplicationName: string;
    FEnvironment: string;
    FDatabase: TDatabaseSettings;
    FSecurity: TSecuritySettings;
  public
    class function LoadFromFile(const AFileName: string): TAppSettings;
    property ApplicationName: string read FApplicationName write FApplicationName;
    property Environment: string read FEnvironment write FEnvironment;
    property Database: TDatabaseSettings read FDatabase write FDatabase;
    property Security: TSecuritySettings read FSecurity write FSecurity;
  end;

implementation

class function TAppSettings.LoadFromFile(const AFileName: string): TAppSettings;
var
  LJson: TJSONObject;
  LDatabase: TJSONObject;
  LSecurity: TJSONObject;
  LContent: string;
begin
  if not FileExists(AFileName) then
    raise Exception.CreateFmt('Arquivo de configuracao nao encontrado: %s', [AFileName]);

  LContent := TFile.ReadAllText(AFileName, TEncoding.UTF8);
  LJson := TJSONObject.ParseJSONValue(LContent) as TJSONObject;
  if LJson = nil then
    raise Exception.Create('Falha ao ler o JSON de configuracao.');

  try
    Result := TAppSettings.Create;
    Result.ApplicationName := LJson.GetValue<string>('applicationName');
    Result.Environment := LJson.GetValue<string>('environment');

    LDatabase := LJson.GetValue<TJSONObject>('database');
    Result.FDatabase.Server := LDatabase.GetValue<string>('server');
    Result.FDatabase.Port := LDatabase.GetValue<Integer>('port');
    Result.FDatabase.Database := LDatabase.GetValue<string>('database');
    Result.FDatabase.UserName := LDatabase.GetValue<string>('userName');
    Result.FDatabase.Password := LDatabase.GetValue<string>('password');

    LSecurity := LJson.GetValue<TJSONObject>('security');
    Result.FSecurity.Pepper := LSecurity.GetValue<string>('pepper');
    Result.FSecurity.SessionMinutes := LSecurity.GetValue<Integer>('sessionMinutes');
  finally
    LJson.Free;
  end;
end;

end.
